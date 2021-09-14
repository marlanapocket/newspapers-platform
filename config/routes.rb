# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root to: 'catalog#home'

  get '/search', to: 'catalog#index'
  get '/catalog/:id', to: 'catalog#show'
  post '/paginate_facets', to: 'catalog#paginate_facets'

  get '/datasets', to: 'dataset#index'
  get '/datasets/update', to: 'dataset#update_datasets_list'
  post '/datasets/working_dataset', to: 'dataset#set_working_dataset'
  post "/datasets/add_documents", to: "dataset#add_documents"
  get "/datasets/list", to: "dataset#list_datasets"
  get '/dataset/:id', to: 'dataset#show'
  post "/dataset/:id/paginate", to: "dataset#paginate"
  post '/dataset/create', to: 'dataset#create_dataset'

  get '/experiments', to: 'experiment#index'
  get '/experiment/:id', to: "experiment#show"
  get '/experiment/:id/load', to: "experiment#load"
  post '/experiment/:id/save', to: "experiment#save"
end
