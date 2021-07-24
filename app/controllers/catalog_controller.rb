class CatalogController < ApplicationController

    before_action :authenticate_user!, :strip_input_fields

    def index
        if params[:q]
            @solr_params = SolrQuery.new.to_params
            @solr_params[:q] = params[:q]
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

    private

    def strip_input_fields
        params.each do |key, value|
            params[key] = value.strip if value.respond_to?("strip")
        end
    end
end
