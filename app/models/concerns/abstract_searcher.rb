module AbstractSearcher
    extend ActiveSupport::Concern

    def self.query
        raise NotImplementedError, "Subclasses must define `query`."
    end

    def self.get_doc_by_id(id)
        raise NotImplementedError, "Subclasses must define `get_doc_by_id`."
    end

end