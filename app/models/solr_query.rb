class SolrQuery

    attr_accessor :defType, :sort, :start, :rows, :fq, :fl,  # common parameters
                  :q, :q_dot_alt, :qf, :mm, :pf, :ps, :qs, :tie, :bq, :bf,  # Dismax parameters
                  :sow, :mm_dot_autorelax, :boost, :lowercaseOperators, :pf2, :ps2, :pf3, :ps3, :stopwords, :uf,  # Edismax parameters
                  :facet, :facet_dot_field, :facet_dot_threads,
                  :hl,
                  :mlt

    def initialize
        @defType = 'edismax'
        @sort = 'score desc'
        @start = 0
        @rows = 10
        # @fq = ["has_model_ssim:(Article OR Issue)"]
        @fq = ["has_model_ssim:(Article)"]
        @fl = '*,score'
        @q = '*:*'
        @q_dot_alt = '*:*'
        @qf = I18n.t("newspapers.solr_fields").select{|k,v| k.start_with? "text_exact" }.values  # or text_stemmed
        @mm = 1
        @pf = ""
        @ps = ""
        @qs = ""
        @tie = 0.1
        @bq = ""
        @bf = ""
        @hl = true
        @hl_dot_fl = @qf

        @json_dot_facet = {}
        I18n.t("newspapers.solr_fields").values_at(:language, :date, :newspaper).each do |f|
            @json_dot_facet[f] = { terms: { field: f, limit: 15, numBuckets: true} }
        end
        I18n.t("newspapers.solr_fields").values_at(:month, :day).each do |f|
            @json_dot_facet[f] = { terms: { field: f, limit: 15, numBuckets: true, sort: {index: "asc"}} }
        end
        I18n.t("newspapers.solr_fields").values_at(:persons, :locations, :organisations, :human_productions).each do |f|
            @json_dot_facet[f] = { terms: { field: f, limit: 15, numBuckets: true} }
        end
        @json_dot_facet["min_date"] = "min(date_created_dtsi)"
        @json_dot_facet["max_date"] = "max(date_created_dtsi)"
    end

    def to_params
        p = self.instance_values.select {|k,v| v != "" and !v.nil?}.transform_keys{|k| k.gsub('_dot_','.')}.with_indifferent_access
        p["json.facet"] = p["json.facet"].to_json
        p
    end

end