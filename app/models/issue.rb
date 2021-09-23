class Issue

    attr_accessor :id, :title, :date_created, :language, :original_uri, :nb_pages, :all_text, :thumbnail_url, :newspaper, :pages, :articles

    def self.from_solr(id, with_pages: false, with_articles: false)
        solr_doc = SolrSearcher.get_doc_by_id id
        Issue.from_solr_doc(solr_doc, with_pages: with_pages, with_articles: with_articles)
    end

    def self.from_solr_doc(solr_doc, with_pages: false, with_articles: false)
        i = Issue.new
        i.id = solr_doc['id']
        i.language = solr_doc['language_ssi']
        i.newspaper = solr_doc['member_of_collection_ids_ssim'][0]
        i.title = solr_doc['title_ssi']
        i.date_created = solr_doc['date_created_ssi']
        i.original_uri = solr_doc['original_uri_ss']
        i.nb_pages = solr_doc['nb_pages_isi']
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

    def named_entities
        nems = SolrSearcher.query({q:"issue_id_ssi:#{self.id}", rows: 1000000})['response']['docs']
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