module NamedEntitiesHelper

    def get_linked_entities entities
        priority_language = [I18n.locale, 'en', 'de', 'fr', 'fi', 'sv']
        ids = entities.select{ |label| label != "" }
        return {} if ids.empty?
        out = {}
        SolrSearcher.query({q: "*:*", fq: "id:(#{ids.join(' ')})", fl: "*", rows: 99999})['response']['docs'].map do |res|
            priority_language.each do |lang|
                unless res["label_#{lang}_ssi"].nil?
                    out[res['id']] = {kb_url: res['kb_url_ssi'], label: res["label_#{lang}_ssi"]}
                    break
                end
            end
        end
        out
    end

    def get_entity_label(options={})
        priority_language = [I18n.locale, 'en', 'de', 'fr', 'fi', 'sv']
        if options.class == Array
            out = {}
            unless options.empty?
                docs = SolrSearcher.query({q: "*:*", fq: "id:(#{options.join(' ')})", fl: "*", rows: 99999})['response']['docs']
                docs.map do |doc|
                    priority_language.each do |lang|
                        unless doc["label_#{lang}_ssi"].nil?
                            out[doc['id']] = doc["label_#{lang}_ssi"]
                            break
                        end
                    end
                end
            end
            return out
        else
            @entities_labels[options]  # set in catalog_controller#index
        end
    end

end