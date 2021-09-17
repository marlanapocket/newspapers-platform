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

    def fetch_paginated_documents(page, per_page, sort, sort_order, type)
        out = []
        docs = self.documents.select {|doc| type == "all" || doc['type'] == type }
        nb_pages = (docs.size / per_page.to_f).ceil
        nb_pages = 1 if nb_pages == 0
        if sort == "date"  # we need to preload dates for sorting before pagination
            # To modify if multiple types can be selected
            if docs[0]['type'] == "compound"
                dates = SolrSearcher.query({q: "*:*",
                                                  fl: "id,date_created_dtsi",
                                                  fq: "id:(#{docs.map{ |d| d['parts'][0] }.join(' ')})",
                                                  rows: 99999}).each_with_index.map{ |d,i| {id: docs[i]['id'], date_created_dtsi: d['date_created_dtsi']} }
            else
                dates = SolrSearcher.query({q: "*:*", fl: "id,date_created_dtsi", fq: "id:(#{docs.map{ |d| d['id'] }.join(' ')})", rows: 99999})
            end
        end
        if sort != "default"
            docs = docs.sort_by do |doc|
                case sort
                when "date"
                    Date.parse(dates.select{|d| d['id'] == doc['id']}[0]['date_created_dtsi'])
                when "relevancy"  # not used
                    doc['relevancy']
                end
            end
        end
        docs.reverse! if sort_order == "desc"
        docs.each_slice(per_page).with_index do |slice, page_idx|
            next if page_idx+1 != page
            slice.each_with_index do |doc, idx|
                doc_idx = page_idx * per_page + idx
                if doc['type'] != "compound"
                    out << doc['id']
                else
                    # if CompoundArticle.exists? doc['id']
                    #     ca = CompoundArticle.find doc['id']
                    #     solr_doc = ca.to_solr_doc
                    #     solr_doc['relevancy'] = doc['relevancy']
                    #     out << solr_doc
                    # end
                end
            end
        end
        solr_ids = out.select {|d| d.class == String }
        unless solr_ids.empty?
            solr_docs = SolrSearcher.query({q: "*:*", fq: "id:(#{solr_ids.join(' ')})", rows: 9999})['response']['docs']
            # solr_docs.map! do |solr_doc|
            #     solr_doc['relevancy'] = self.relevancy_for_doc solr_doc['id']
            #     solr_doc
            # end
            out.map! do |doc|
                if doc.class == String
                    solr_docs.select {|d| d['id'] == doc }[0]
                else
                    doc
                end
            end
        end
        return {docs: out, nb_pages: nb_pages}
    end

end
