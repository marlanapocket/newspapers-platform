module SearchHelper

    def current_page_params
        params.to_unsafe_h.slice('q', 'page', 'per_page','sort', 'f')
    end

    def merge_facets(parameters, new)
        parameters.merge(new) do |key, oldval, newval|
            oldval.merge(newval)
        end
    end

    def convert_solr_date_to_datepicker_date solr_date
        DateTime.parse(solr_date).strftime("%Y-%m-%d")
    end

    def convert_datepicker_date_to_solr_date solr_date
        DateTime.parse(solr_date).strftime("%Y-%m-%d")
    end

    def search_constraints
        constraints = []
        if current_page_params[:f]
            current_page_params[:f].each do |f, vals|
                if f == "date_created_dtsi"
                    constraints << {label: f, value: "From #{vals['from']} To #{vals['to']}"}
                else
                    vals.each do |val|
                        constraints << {label: f, value: val}
                    end
                end
            end
        end
        constraints
    end

end