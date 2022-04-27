class DatasetController < ApplicationController

    before_action :authenticate_user!

    ##
    # List all datasets
    def index
    end

    ##
    # Display a single dataset
    def show
        @dataset = Dataset.find(params[:id])
        @current_page = params[:page] || 1
        @per_page = params[:per_page] || 10
        session[:working_dataset] = @dataset.id
    end

    ##
    # Create a new empty dataset
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

    ##
    # Rename an existing dataset
    def rename_dataset
        dataset = Dataset.find(params[:id])
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

    ##
    # Import a public dataset
    def import_dataset
        to_copy = Dataset.find params[:original_dataset_id]
        render json: {status: "error", message: "This dataset is not public."} unless to_copy.public?
        new_dataset = Dataset.new
        new_dataset.user_id = current_user.id
        new_dataset.title = params[:title]
        to_copy.documents.each do |doc|
            if doc['type'] == "compound"
                ca = CompoundArticle.find(doc['id']).dup
                ca.user = current_user
                begin
                    ca.save!
                rescue ActiveRecord::RecordNotUnique
                    ca.title = "_#{(0...8).map { (65 + rand(26)).chr }.join}_#{ca.title}"
                    ca.save!
                end
                new_dataset.documents << {id: ca.id, type: "compound"}
            else
                new_dataset.documents << doc
            end
        end
        begin
            new_dataset.save!
            render json: {status: 'ok'}
        rescue ActiveRecord::RecordNotUnique
            render json: {status: "error", message: "A dataset with this title already exists."}
        rescue ActiveRecord::RecordInvalid
            render json: {status: "error", message: "The title should not be blank."}
        end
    end

    ##
    # Delete an existing dataset
    def delete_dataset
        dataset = Dataset.find(params[:dataset_id])
        dataset_id = dataset.id
        dataset.destroy
        if session[:working_dataset] == dataset_id
            if current_user.datasets.first
                session[:working_dataset] = current_user.datasets.first.id
            else
                session[:working_dataset] = nil
            end
        end
    end

    ##
    # Update the view of the list of datasets
    def update_datasets_list
        respond_to do |format|
            format.js
        end
    end

    ##
    #
    def set_working_dataset
        session[:working_dataset] = params[:dataset_id]
        @title = Dataset.find(session[:working_dataset]).title
        respond_to do |format|
            format.js
        end
    end

    def add_selected_documents
        out = {}
        @nb_added_docs = params[:documents_ids].size
        dataset = Dataset.find(session[:working_dataset])
        existing = dataset.add_documents params[:documents_ids]  # Add docs and return existing ids
        @nb_added_docs -= existing.size
        title = dataset.title
        message = "<p> #{@nb_added_docs} document#{@nb_added_docs > 1 ? "s were" : " was"} added to your dataset.</p>"
        message.concat "<p>#{existing.size} document#{existing.size > 1 ? "s" : ""} already exist in this dataset.</p>" unless existing.empty?
        # render partial: "shared/notification", locals: {notif_title: title, notif_content: message.html_safe}
        out['notif'] = render_to_string layout: false, partial: "shared/notification", locals: {notif_title: title, notif_content: message.html_safe}
        out['nbissues'] = dataset.documents.select{|d| d['type'] == "issue" }.size
        out['nbarticles'] = dataset.documents.select{|d| d['type'] == "article" }.size
        out['nbdocs'] = out['nbissues'] + out['nbarticles']
        out['title'] = title
        out['results_datasets'] = params[:documents_ids].map{ |docid| [docid, render_to_string(layout: false, partial: 'catalog/result_datasets', locals: {doc_id: docid})] }.to_h
        render json: out
    end

    def add_compound
        out = {}
        dataset = Dataset.find(session[:working_dataset])
        existing = dataset.add_compound params[:compound_id]  # Add docs and return existing ids
        title = dataset.title
        message = "<p> The compound article was added to your dataset.</p>"
        out['notif'] = render_to_string layout: false, partial: "shared/notification", locals: {notif_title: title, notif_content: message.html_safe}
        out['nbissues'] = dataset.documents.select{|d| d['type'] == "issue" }.size
        out['nbarticles'] = dataset.documents.select{|d| d['type'] == "article" }.size
        out['nbcompounds'] = dataset.documents.select{|d| d['type'] == "compound" }.size
        out['nbdocs'] = out['nbissues'] + out['nbarticles'] + out['nbcompounds']
        out['title'] = title
        render json: out
    end

    def remove_selected_documents
        @nb_removed_docs = params[:documents_ids].size
        dataset = Dataset.find(session[:working_dataset])
        dataset.remove_documents params[:documents_ids]
        redirect_to action: "show", id: dataset.id
    end

    def add_all_documents
        SearchToDatasetWorker.perform_async(current_user.id, session[:working_dataset], params[:search_params].to_unsafe_h)
        title = Dataset.find(session[:working_dataset]).title
        message = "<p>Documents are being added to your dataset. You will be notified when the operation is done.</p>"
        render partial: "shared/notification", locals: {notif_title: title, notif_content: message.html_safe}
    end

    def export_dataset
        ExportDatasetWorker.perform_async(current_user.id, params[:dataset_id], params[:export_type])
        title = Dataset.find(params[:dataset_id]).title
        message = "<p>The export is being prepared. You will be notified when the operation is done.</p>"
        render partial: "shared/notification", locals: {notif_title: title, notif_content: message.html_safe}
    end

    def toggle_sharing_status
        @dataset = Dataset.find(params[:dataset_id])
        @dataset.toggle!(:public)
        render partial: 'dataset_info'
    end

    def paginate
        out = {}
        d = Dataset.find params['id']
        rows = params[:per_page].to_i
        res = d.fetch_paginated_documents(params[:page].to_i, rows, params[:sort], params[:sort_order], params[:type])
        out[:documents] = render_to_string(layout: false,
                                           partial: "documents",
                                           locals: {docs: res[:docs], rows: rows, pagenum: params[:page].to_i})
        out[:pagination] = render_to_string(layout: false,
                                            partial: "pagination",
                                            locals: {nb_pages: res[:nb_pages].to_i, current_page: params[:page].to_i})
        render json: out
    end

    def list_datasets
        render json: current_user.datasets.to_json
    end
end
