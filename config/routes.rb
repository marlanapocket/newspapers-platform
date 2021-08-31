# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root to: 'home#index'

  get '/search', to: 'catalog#index'
  post '/paginate_facets', to: 'catalog#paginate_facets'

  get '/datasets', to: 'dataset#index'
  get '/experiments', to: 'experiment#index'
end
