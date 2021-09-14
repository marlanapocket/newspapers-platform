class ExperimentController < ApplicationController

    before_action :authenticate_user!

    def index
    end

    def show
        @experiment = Experiment.find params[:id]
        @tools_description = File.read("#{Rails.root}/public/newspapers_tools.json")
    end

    def save
        experiment = Experiment.find(params[:id])
        experiment.description = JSON.parse(params[:description])
        experiment.save
    end

    def load
        experiment = Experiment.find(params[:id])
        render json: experiment.description.to_json
    end
end
