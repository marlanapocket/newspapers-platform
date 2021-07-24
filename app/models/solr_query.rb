class SolrQuery

    attr_accessor :defType, :sort, :start, :rows, :fq, :fl,  # common parameters
                  :q, :q_dot_alt, :qf, :mm, :pf, :ps, :qs, :tie, :bq, :bf,  # Dismax parameters
                  :sow, :mm_dot_autorelax, :boost, :lowercaseOperators, :pf2, :ps2, :pf3, :ps3, :stopwords, :uf,  # Edismax parameters
                  :facet, :facet_dot_field,
                  :hl,
                  :mlt

    def initialize
        @defType = 'edismax'
        @sort = 'score desc'
        @start = 0
        @rows = 10
        @fq = ["has_model_ssim:(Article OR Issue)"]
        @fl = '*,score'
        @q = '*:*'
        @q_dot_alt = '*:*'
        @qf = "all_text_tfr_siv"
        @mm = 1
        @pf = ""
        @ps = ""
        @qs = ""
        @tie = 0.1
        @bq = ""
        @bf = ""
        @facet = true
        @facet_dot_field = ["language_ssi", "member_of_collection_ids_ssim", "linked_persons_ssim", "linked_locations_ssim"]
        @f_dot_linked_persons_ssim_dot_facet_dot_limit = 10000
        @f_dot_linked_locations_ssim_dot_facet_dot_limit = 10000
    end

    def to_params
        self.instance_values.select {|k,v| v != ""}.transform_keys{|k| k.gsub('_dot_','.')}.with_indifferent_access
    end

end