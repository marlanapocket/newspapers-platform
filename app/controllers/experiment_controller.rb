class ExperimentController < ApplicationController

    before_action :authenticate_user!

    def index
    end

    def create
        experiment = Experiment.new
        experiment.user = current_user
        experiment.title = params[:title]
        begin
            experiment.save!
            render json: {status: 'ok'}
        rescue ActiveRecord::RecordNotUnique
            render json: {status: "error", message: "An experiment with this title already exists."}
        rescue ActiveRecord::RecordInvalid
            render json: {status: "error", message: "The title should not be blank."}
        end
    end

    def delete
        experiment = Experiment.find(params[:experiment_id])
        root_ids = experiment.description["children"].map{|root| root['tool']['id'] }
        root_ids.each do |root_id|
            Tool.destroy(experiment.delete_tool(root_id))
        end
        experiment.destroy
    end

    def show
        @experiment = Experiment.find params[:id]
        @tools = @experiment.load_tools
        @tools = JSON.parse(File.read("#{Rails.root}/lib/newspapers_tools.json"))
        @tools['tools']['processors'].delete_if{ |h| h["type"] == "splitter" }
    end

    def update_experiments_list
        respond_to do |format|
            format.js
        end
    end

    def add_tool
        @experiment = Experiment.find(params[:id])
        tool_params = JSON.parse params[:tool]
        tool = Tool.new
        tool.tool_type = tool_params['type']
        tool.input_type = tool_params['input_type']
        tool.output_type = tool_params['output_type']
        tool.parameters = tool_params['parameters']
        tool.status = "created"
        tool.parent_id = params[:parent_id]#(params[:parent_id] == "") ? nil : Tool.find(params[:parent_id])
        tool.experiment = @experiment
        tool.save!
        @experiment.add_tool(params[:parent_id].to_i, tool)
        @experiment.save!
        render 'experiment/update_experiment_area'
    end

    def delete_tool
        @experiment = Experiment.find(params[:id])
        tools_to_destroy_ids = @experiment.delete_tool(params[:tool_id].to_i)
        @experiment.save!
        Tool.destroy(tools_to_destroy_ids)
        render 'experiment/update_experiment_area'
    end

    def edit_tool_form
        @tool = Tool.find(params[:tool_id])
        render partial: 'tool/parameters', locals: {tool: @tool}
    end

    def edit_tool
        @experiment = Experiment.find(params[:id])
        @tool = Tool.find(params[:tool_id])
        modified = false
        @tool.parameters.map! do |param|
            if param['value'] != params[:parameters][param['name']]
                modified = true
            end
            param['value'] = params[:parameters][param['name']]
            param
        end
        @tool.status = "configured" if modified
        @tool.save!
        render 'experiment/update_experiment_area'
    end

    def tool_results
        @experiment = Experiment.find(params[:id])
        @tool = Tool.find(params[:tool_id])
        render partial: 'tool/results', locals: {tool: @tool, experiment: @experiment}
    end

    def run_tool
        @experiment = Experiment.find(params[:id])
        @tool = Tool.find(params[:tool_id])
        @tool.run()
        render 'experiment/update_experiment_area'
    end

    def run_experiment
        out = {}
        @experiment = Experiment.find(params[:experiment_id])
        ids = @experiment.get_tool_ids
        running = false
        ids.map{|id| Tool.find(id)}.each do |tool|
            if tool.runnable?
                tool.run(true)
                running = true
            end
        end
        out[:html_tree] = render_to_string partial: "tree", locals: {experiment: @experiment}
        out[:experiment_running] = running
        render json: out
    end
end
