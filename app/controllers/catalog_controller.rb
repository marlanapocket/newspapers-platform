class CatalogController < ApplicationController

    before_action :authenticate_user!, :strip_input_fields

    def home

    end

    def index
        if params[:q]
            @solr_params = SolrQuery.new.to_params
            @solr_params[:q] = params[:q]
            @solr_params[:rows] = params[:per_page] if params[:per_page]
            @current_page = params[:page].to_i != 0 ? params[:page].to_i : 1
            @solr_params[:start] = params[:page].to_i != 0 ? @solr_params[:rows] * (params[:page].to_i-1) : 0
            @solr_params[:sort] = params[:sort] if params[:sort]
            if params[:f]
                params[:f].each do |k,v|
                    v.each do |val|
                        @solr_params[:fq] << "#{k}:#{val}"
                    end
                end
            end
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
        if params[:id].include? "_article_"
            @article = Article.from_solr params[:id]
            @issue = Issue.from_solr @article.issue_id, with_pages: true, with_articles: true
        else
            @article = nil
            @issue = Issue.from_solr params[:id], with_pages: true, with_articles: true
        end
        # @pages_links = @issue.pages.map do |p|
        #     url = "#{p.iiif_url}/info.json"
        #     url = url.gsub("platform.newseye.eu", "localhost:3000").gsub("https://", "http://") if Rails.env == "development"
        #     url
        # end
    end

    def paginate_facets
        render partial: 'paginate_facets', locals: {total: params[:total], per_page: params[:per_page], current_page: params[:page]}
    end

    private

    def strip_input_fields
        params.each do |key, value|
            params[key] = value.strip if value.respond_to?("strip")
        end
    end
end
