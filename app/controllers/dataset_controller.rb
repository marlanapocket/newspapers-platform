class DatasetController < ApplicationController

    before_action :authenticate_user!

    def index
    end

    def show
        @dataset = Dataset.find(params[:id])
    end

    def create_dataset
        dataset = Dataset.new
        dataset.user = current_user
        dataset.title = params[:title]
        begin
            dataset.save!
            render json: {status: 'ok'}
        rescue ActiveRecord::RecordNotUnique
            render json: {status: "error", message: "A dataset with this title already exists."}
        rescue ActiveRecord::RecordInvalid
            render json: {status: "error", message: "The title should not be blank."}
        end
    end

    def update_datasets_list
        respond_to do |format|
            format.js
        end
    end

    def set_working_dataset
        session[:working_dataset] = params[:dataset_id]
        @title = Dataset.find(session[:working_dataset]).title
        respond_to do |format|
            format.js
        end
    end

    def add_documents
        @nb_added_docs = params[:documents_ids].size
        dataset = Dataset.find(session[:working_dataset])
        dataset.add_documents params[:documents_ids]
        @title = dataset.title
        respond_to do |format|
            format.js
        end
    end

    def paginate
        d = Dataset.find params['id']
        @rows = params[:per_page].to_i
        res = d.fetch_paginated_documents(params[:page].to_i, @rows, params[:sort], params[:sort_order], params[:type])
        @docs = res[:docs].map do |solr_doc|
            if solr_doc['id'].index("_article_") >= 0
                Article.from_solr_doc solr_doc
            else
                Issue.from_solr_doc solr_doc
            end
        end
        # @nb_pages = res[:nb_pages]
        @pagenum = params[:page].to_i
        # @counter = (params[:page].to_i - 1) * params[:per_page].to_i
    end
end
