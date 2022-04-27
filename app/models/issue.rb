class Issue

    attr_accessor :id, :title, :date_created, :language, :original_uri, :nb_pages, :all_text, :thumbnail_url, :newspaper, :pages, :articles

    def self.from_solr(id, with_pages=false, with_articles=false)
        solr_doc = SolrSearcher.get_doc_by_id id
        Issue.from_solr_doc(solr_doc, with_pages, with_articles)
    end

    def self.from_solr_doc(solr_doc, with_pages=false, with_articles=false)
        i = Issue.new
        i.id = solr_doc['id']
        i.language = solr_doc['language_ssi']
        i.newspaper = solr_doc['member_of_collection_ids_ssim'][0]
        i.title = solr_doc['title_ssi']
        i.date_created = solr_doc['date_created_ssi']
        i.original_uri = solr_doc['original_uri_ss']
        i.nb_pages = solr_doc['member_ids_ssim'].size
        i.thumbnail_url = solr_doc['thumbnail_url_ss']
        i.all_text = solr_doc["all_text_t#{i.language}_siv"]
        if with_pages
            i.pages = []
            solr_doc['member_ids_ssim'].each do |pageid|
                i.pages << Page.from_solr(pageid)
            end
        end
        if with_articles
            i.articles = []
            articles_docs = SolrSearcher.query({q: "*:*", fq: ["from_issue_ssi:#{i.id}", "has_model_ssim:Article"], fl:"*", rows:10000})['response']['docs']
            articles_docs.each do |articles_doc|
                i.articles << Article.from_solr_doc(articles_doc)
            end
        end
        i
    end

    def to_solr
        solr_doc = {}
        solr_doc['id'] =  self.id
        solr_doc['has_model_ssim'] =  'Issue'
        solr_doc['title_ssi'] =  self.title
        solr_doc['date_created_ssi'] =  self.date_created
        solr_doc['date_created_dtsi'] =  DateTime.parse(self.date_created).strftime('%Y-%m-%dT%H:%M:%SZ')
        solr_doc['language_ssi'] =  self.language
        solr_doc['original_uri_ss'] =  self.original_uri
        solr_doc['nb_pages_isi'] =  self.nb_pages
        solr_doc['thumbnail_url_ss'] =  self.thumbnail_url
        solr_doc['member_ids_ssim'] =  self.pages.map(&:id)
        solr_doc['year_isi'] = solr_doc['date_created_ssi'][0..3].to_i
        d = DateTime.parse solr_doc["date_created_dtsi"]
        solr_doc['month_isi'] = d.month
        solr_doc['day_isi'] = d.wday
        solr_doc["member_of_collection_ids_ssim"] = self.newspaper
        solr_doc["all_text_t#{self.language}_siv"] = self.all_text
        solr_doc["all_text_unstemmed_t#{self.language}_siv"] = self.all_text
        solr_doc
    end

    def get_thumbnail
        if Rails.configuration.iiif_sources[:local].include? self.newspaper
            "https://iiif.newseye.eu/iiif/#{self.newspaper}/#{self.id}_page_1.ptif/full/200,/0/default.jpg"
        elsif Rails.configuration.iiif_sources[:external].include? self.newspaper
            iiif_pages = self.pages.map{ |p| "#{p.iiif_url}/info.json" }  # to change
        elsif Rails.configuration.iiif_sources[:external_onb].include? self.newspaper
            iiif_pages = self.pages.map{ |p| "#{p.iiif_url}/info.json" }  # to change
        end
    end

    def get_iiif_urls
        if Rails.configuration.iiif_sources[:local].include? self.newspaper
            iiif_pages = self.pages.map do |p|
                "https://iiif.newseye.eu/iiif/#{self.newspaper}/#{self.id}_page_#{p.page_number}.ptif/info.json"
            end
        elsif Rails.configuration.iiif_sources[:external].include? self.newspaper
            iiif_pages = self.pages.map{ |p| "#{p.iiif_url}/info.json" }
        elsif Rails.configuration.iiif_sources[:external_onb].include? self.newspaper
            iiif_pages = self.pages.map{ |p| "#{p.iiif_url}/info.json" }
        end
        iiif_pages
    end

    def self.named_entities(issue_id)
        nems = SolrSearcher.query({q:"issue_id_ssi:#{issue_id}", rows: 1000000})['response']['docs']
        output = {LOC: {}, PER: {}, ORG: {}, HumanProd: {}}
        nems.select {|ne_solr| ne_solr['type_ssi'] == "LOC"}.each do |ne_solr|
            output[:LOC][ne_solr['linked_entity_ssi']] = [] unless output[:LOC].has_key? ne_solr['linked_entity_ssi']
            output[:LOC][ne_solr['linked_entity_ssi']].append(ne_solr)
        end
        nems.select {|ne_solr| ne_solr['type_ssi'] == "PER"}.each do |ne_solr|
            output[:PER][ne_solr['linked_entity_ssi']] = [] unless output[:PER].has_key? ne_solr['linked_entity_ssi']
            output[:PER][ne_solr['linked_entity_ssi']].append(ne_solr)
        end
        nems.select {|ne_solr| ne_solr['type_ssi'] == "ORG"}.each do |ne_solr|
            output[:ORG][ne_solr['linked_entity_ssi']] = [] unless output[:ORG].has_key? ne_solr['linked_entity_ssi']
            output[:ORG][ne_solr['linked_entity_ssi']].append(ne_solr)
        end
        nems.select {|ne_solr| ne_solr['type_ssi'] == "HumanProd"}.each do |ne_solr|
            output[:HumanProd][ne_solr['linked_entity_ssi']] = [] unless output[:HumanProd].has_key? ne_solr['linked_entity_ssi']
            output[:HumanProd][ne_solr['linked_entity_ssi']].append(ne_solr)
        end
        output
    end
end