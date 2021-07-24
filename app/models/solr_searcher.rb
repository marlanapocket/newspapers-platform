class SolrSearcher
    include AbstractSearcher

    @@connection = false

    def self.query params
        connect unless @@connection
        @@connection.send_and_receive("select", data: params, method: :post)
    end

    def self.connect
        @@connection = RSolr.connect(url: Rails.configuration.solr['url']) unless @@connection
    end

    def get_doc_by_id(id)
        connect unless @@connection
        docs = @@connection.send_and_receive("select", data: {id:"#{id}"}, method: :post)['results']['docs']
        if docs.empty?
            nil
        else
            docs[0]
        end
    end

end