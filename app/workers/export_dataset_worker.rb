require "zip"

class ExportDatasetWorker
    include Sidekiq::Worker
    include ActionView::Helpers::FormOptionsHelper

    def perform(user_id, dataset_id, export_type)
        dataset = Dataset.find(dataset_id)
        file = Tempfile.new(["export_#{dataset.title.parameterize(separator: '_')}_", ".#{export_type}"], "tmp")
        to_write = []
        named_entities = dataset.named_entities
        named_entities = named_entities.values.map{|h| h.values }.flatten
        documents = dataset.fetch_paginated_documents(1, 100, "default", "asc", "all", recursive=true)
        documents[:docs].map do |doc|
            case export_type
            when "json"
                lang = doc.language
                thumb = doc.thumbnail_url
                if doc.is_a?(CompoundArticle)
                    doc_type = "compound"
                    entities = named_entities.select{ |ne| doc.parts.include? ne['article_id_ssi'] }
                elsif doc.is_a?(Article)
                    doc_type = "article"
                    entities = named_entities.select{ |ne| doc.id == ne['article_id_ssi'] }
                elsif doc.is_a?(Issue)
                    doc_type = "issue"
                    entities = named_entities.select{ |ne| doc.id == ne['issue_id_ssi'] }
                end
                entities = entities.map do |ne|
                    {
                      mention: ne['mention_ssi'],
                      indexStart: ne['article_index_start_isi'],
                      indexEnd: ne['article_index_end_isi'],
                      stance: if ne['stance_fsi'] == 0
                                  "neutral"
                              else
                                  ne['stance_fsi'] > 0 ? "positive" : "negative"
                              end,
                      linked_entity_url: ne['linked_entity_ssi'] == "" ? nil : "https://www.wikidata.org/wiki/#{ne['linked_entity_ssi'].split('_')[-1]}"
                    }
                end
                unless under_copyright(lang, doc.date_created, User.find(user_id))
                    to_write << { id: doc.id,
                                  type: doc_type,
                                  language: lang,
                                  date: doc.date_created,
                                  newspaper_id: doc.newspaper,
                                  iiif_url: thumb,
                                  text: doc.all_text,
                                  named_entities: entities }
                end
            when "zip"
                filename = "#{doc.date_created}_#{doc.is_a?(CompoundArticle) ? "compound_#{doc.title}" : doc.id}.txt"
                file_content = doc.all_text
                File.open("/tmp/#{filename}", 'w') do |f|
                    f.write file_content
                end
                to_write << filename
            end
        end
        case export_type
        when "json"
            to_write = {"documents": to_write}
            file.write to_write.to_json
            file.close
        when "zip"
            Zip::File.open(file.path, Zip::File::CREATE) do |zipfile|
                to_write.each do |filename|
                    zipfile.add filename,  "/tmp/#{filename}" if filename
                end
            end
            to_write.each do |filename|
                File.delete("/tmp/#{filename}") if filename
            end
        end
        content = "<p>Your dataset is ready. <a target=\"_blank\" href=\"/send?filename=#{File.basename(file.path)}\">Click here</a> to download it.</p>"
        ActionCable.server.broadcast("notifications.#{user_id}", {
          type: "notify",
          html: ApplicationController.render(partial: "shared/notification", locals: {notif_title: dataset.title, notif_content: content})
        })
    end

    def under_copyright(lang, date, user)
        nlf_doc = ["fi", "se"].include? lang
        nlf_under_copyright = Date.parse("1910-12-31T00:00:00Z") <= Date.parse(date)
        nlf_doc and nlf_under_copyright and !user.groups.include? "researcher"
    end
end