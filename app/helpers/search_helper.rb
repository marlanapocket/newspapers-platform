module SearchHelper
    def current_page_params
        request.params.slice('q', 'page', 'per_page','sort', 'f')
    end
end