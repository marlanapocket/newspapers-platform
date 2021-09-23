module SearchHelper

    def current_page_params
        params.to_unsafe_h.slice('q', 'page', 'per_page','sort', 'f')
    end

    def merge_facets(parameters, new)
        parameters.merge(new) do |key, oldval, newval|
            oldval.merge(newval)
        end
    end

    def search_constraints
        constraints = []
        if current_page_params[:f]
            current_page_params[:f].each do |f, vals|
                vals.each do |val|
                    constraints << {label: f, value: val}
                end
            end
        end
        constraints
    end

end