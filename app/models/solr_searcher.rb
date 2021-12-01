class SolrSearcher
    include AbstractSearcher

    @@connection = false

    def self.query params
        connect unless @@connection
        puts "[SolrSearcher.Query] #{params.to_json}\n" if Rails.env == "development"
        @@connection.send_and_receive("select", data: params, method: :post)
    end

    def self.connect
        @@connection = RSolr.connect(url: Rails.configuration.solr['url']) unless @@connection
    end

    def self.get_doc_by_id(id)
        connect unless @@connection
        docs = @@connection.send_and_receive("select", data: {q: "id:#{id}"}, method: :post)['response']['docs']
        if docs.empty?
            nil
        else
            docs[0]
        end
    end

end