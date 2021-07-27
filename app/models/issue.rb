class Issue

    attr_accessor :id, :title, :date_created, :language, :original_uri, :nb_pages, :all_text, :thumbnail_url, :newspaper_id, :pages, :articles

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
            ids = SolrSearcher.query({q:"from_issue_ssi:#{id} AND has_model_ssim:Article", fl:"id", rows:100000000})['response']['docs'].map {|o| o['id']}
            ids.each do |solr_article_id|
                i.articles << Article.from_solr(solr_article_id)
            end
        end
        i
    end
end