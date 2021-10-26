class ExportDatasetWorker
    include Sidekiq::Worker
    include ActionView::Helpers::FormOptionsHelper

    def perform(user_id, dataset_id)
        dataset = Dataset.find(dataset_id)
        file = Tempfile.new(["export_#{dataset.title.parameterize(separator: '_')}_", ".json"], "tmp")
        to_write = []
        named_entities = dataset.named_entities
        named_entities = named_entities.values.map{|h| h.values }.flatten
        documents = dataset.fetch_paginated_documents(1, 100, "default", "asc", "all", recursive=true)
        documents[:docs].map do |solr_doc|
            lang = solr_doc['language_ssi']
            thumb = solr_doc['thumbnail_url_ss_list'].nil? ? solr_doc['thumbnail_url_ss'] : solr_doc['thumbnail_url_ss_list'].split("\n")
            if solr_doc["article_parts_ssim"]  # solr_doc type : compound
                doc_type = "compound"
                entities = named_entities.select{ |ne| solr_doc['article_parts_ssim'].include? ne['article_id_ssi'] }
            elsif solr_doc["has_model_ssim"].include? "Article" # solr_doc type : article
                doc_type = "article"
                entities = named_entities.select{ |ne| solr_doc['id'] == ne['article_id_ssi'] }
            elsif solr_doc["has_model_ssim"].include? "Issue" # solr_doc type : issue
                doc_type = "issue"
                entities = named_entities.select{ |ne| solr_doc['id'] == ne['issue_id_ssi'] }
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
            unless under_copyright(lang, solr_doc['date_created_dtsi'], User.find(user_id))
                to_write << { id: solr_doc['id'],
                              type: doc_type,
                              language: lang,
                              date: solr_doc['date_created_dtsi'],
                              newspaper_id: solr_doc['member_of_collection_ids_ssim'][0],
                              iiif_url: thumb,
                              relevancy: solr_doc['relevancy'],
                              text: solr_doc["all_text_t#{lang}_siv"],
                              named_entities: entities }
            end
        end
        to_write = {"documents": to_write}
        file.write to_write.to_json
        file.close
        content = "<p>Your dataset is ready. <a href=\"/send?filename=#{File.basename(file.path)}\">Click here</a> to download it.</p>"
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