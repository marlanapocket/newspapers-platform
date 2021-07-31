class CatalogController < ApplicationController

    before_action :authenticate_user!, :strip_input_fields

    def index
        if params[:q]
            @solr_params = SolrQuery.new.to_params
            @solr_params[:q] = params[:q]
            @solr_params[:rows] = params[:per_page] if params[:per_page]
            @current_page = params[:page].to_i != 0 ? params[:page].to_i : 1
            @solr_params[:start] = params[:page].to_i != 0 ? @solr_params[:rows] * (params[:page].to_i-1) : 0
            @solr_params[:sort] = params[:sort] if params[:sort]
            puts @solr_params
            @results = SolrSearcher.query @solr_params
            @resulting_docs = @results['response']['docs'].map do |solr_doc|
                case solr_doc['has_model_ssim']
                when ['Article']
                    Article.from_solr_doc solr_doc
                when ['Issue']
                    Issue.from_solr_doc solr_doc
                end
            end
        end

    end

    def show
    end

    def paginate
        render partial: 'paginate_results', locals: {total: params[:total], per_page: params[:per_page], current_page: params[:page]}
    end

    private

    def search_parameters
        params.permit :q, :page, :f
    end

    def strip_input_fields
        params.each do |key, value|
            params[key] = value.strip if value.respond_to?("strip")
        end
    end
end
