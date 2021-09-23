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
        @qf = "all_text_tfr_siv"
        @mm = 1
        @pf = ""
        @ps = ""
        @qs = ""
        @tie = 0.1
        @bq = ""
        @bf = ""
        @facet = true
        @facet_dot_field = I18n.t("newspapers.solr_fields").values_at(:language, :date, :month, :day, :newspaper, :persons, :locations, :organisations)
        I18n.t("newspapers.solr_fields").values_at(:month, :day).each do |field|
            self.instance_variable_set("@f_dot_#{field}_dot_facet_dot_sort", 'index')
        end
        @f_dot_linked_persons_ssim_dot_facet_dot_limit = 10000
        @f_dot_linked_locations_ssim_dot_facet_dot_limit = 10000
        @f_dot_linked_organisations_ssim_dot_facet_dot_limit = 10000
        @facet_dot_threads = 4
        @hl = true
        @hl_dot_fl = "all_text_tfr_siv"
    end

    def to_params
        self.instance_values.select {|k,v| v != ""}.transform_keys{|k| k.gsub('_dot_','.')}.with_indifferent_access
    end

end