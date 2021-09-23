class Dataset < ActiveRecord::Base

    # after_find :nb_issues, :nb_articles
    belongs_to :user, optional: false
    validates :title, length: { minimum: 1 }

    def add_documents(documents_ids)
        documents_ids.each do |doc_id|
            unless self.documents.any?{ |doc| doc['id'] == doc_id }
                doc_type = doc_id.index("_article_").nil? ? "issue" : "article"
                self.documents << {id: doc_id, type: doc_type}
            end
        end
        self.save
    end

    def nb_issues
        self.documents.select do |doc|
            doc['type'] == 'issue'
        end.size
    end

    def nb_articles
        self.documents.select do |doc|
            doc['type'] == 'article'
        end.size
    end

    def fetch_paginated_documents(page, per_page, sort, sort_order, type, recursive=false)
        docs = self.documents.select {|doc| type == "all" || doc['type'] == type }

        nb_pages = (docs.size / per_page.to_f).ceil
        nb_pages = 1 if nb_pages == 0
        solr_ids = docs.map{ |d| d['id'] }
        sort = (sort == "default") ? "score" : sort
        solr_docs = nil
        unless solr_ids.empty?
            solr_docs = SolrSearcher.query({
                                             q: "*:*",
                                             fq: "id:(#{solr_ids.join(' ')})",
                                             rows: per_page,
                                             sort: "#{sort} #{sort_order}",
                                             start: (page-1)*per_page
                                           })['response']['docs']
        end
        if recursive and page <= nb_pages and !solr_docs.nil?
            solr_docs = solr_docs.concat fetch_paginated_documents(page+1, per_page, sort, sort_order, type, true)[:docs]
        end
        return {docs: solr_docs.nil? ? [] : solr_docs, nb_pages: nb_pages}
    end

    def named_entities
        article_ids = self.documents.select {|d| d['type'] == 'article' }.map{|d| d['id']}
        issue_ids = self.documents.select {|d| d['type'] == 'issue' }.map{|d| d['id']}
        nems = []
        nems = SolrSearcher.query({q: "*:*", fq: "article_id_ssi:(#{article_ids.join(' OR ')})", rows: 1000000})['response']['docs'] unless article_ids.empty?
        nems += SolrSearcher.query({q: "*:*", fq: "issue_id_ssi:(#{issue_ids.join(' OR ')})", rows: 1000000})['response']['docs'] unless issue_ids.empty?
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
