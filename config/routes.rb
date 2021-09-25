# frozen_string_literal: true
require 'sidekiq/web'
Rails.application.routes.draw do
    devise_for :users
    # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
    root to: 'catalog#home'

    get '/search', to: 'catalog#index'
    get '/catalog/:id', to: 'catalog#show'
    post '/catalog/facet_pagination', to: 'catalog#paginate_facets'
    post '/named_entities', to: 'catalog#named_entities_for_doc'
    post '/dataset_named_entities', to: 'catalog#named_entities_for_dataset'

    get '/datasets', to: 'dataset#index'
    get '/datasets/update', to: 'dataset#update_datasets_list'
    post '/datasets/working_dataset', to: 'dataset#set_working_dataset'
    post "/datasets/add_selected_documents", to: "dataset#add_selected_documents"
    post "/datasets/add_all_documents", to: "dataset#add_all_documents"
    get "/datasets/list", to: "dataset#list_datasets"
    get '/dataset/:id', to: 'dataset#show'
    post "/dataset/:id/paginate", to: "dataset#paginate"
    post '/dataset/create', to: 'dataset#create_dataset'

    get '/experiments', to: 'experiment#index'
    get '/experiments/update', to: 'experiment#update_experiments_list'
    post '/experiment/create', to: 'experiment#create'
    get '/experiment/:id', to: "experiment#show"
    get '/experiment/:id/load', to: "experiment#load"
    post '/experiment/:id/save', to: "experiment#save"
    post '/experiment/:id/add_tool', to: "experiment#add_tool"
    post '/experiment/:id/delete_tool', to: "experiment#delete_tool"
    post '/experiment/:id/edit_tool', to: "experiment#edit_tool"
    post '/experiment/:id/edit_tool_form', to: "experiment#edit_tool_form"
    post '/experiment/:id/tool_results', to: "experiment#tool_results"
    post '/experiment/:id/run_tool', to: "experiment#run_tool"
    post '/experiment/:id/run_experiment', to: "experiment#run_experiment"

    resources :tool, only: [:show, :create, :update, :destroy]

    mount ActionCable.server => '/cable'
    if Rails.env.development?
        mount Sidekiq::Web => '/sidekiq'
    end
end
