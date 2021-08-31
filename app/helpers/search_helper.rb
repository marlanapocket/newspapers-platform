module SearchHelper

    def current_page_params
        request.params.slice('q', 'page', 'per_page','sort', 'f')
    end

    def merge_facets(parameters, new)
        parameters.merge(new) do |key, oldval, newval|
            oldval.merge(newval)
        end
    end

    def search_constraints
        constraints = []
        if current_page_params[:f]
            current_page_params[:f].each do |k,v|
                constraints << {label: k, value: v[0]}
            end
        end
        constraints
    end

end