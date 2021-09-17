class ToolRunnerWorker
    include Sidekiq::Worker

    def perform(tool_id, user_id, tool_type, tool_parameters)
        ActionCable.server.broadcast("notifications.#{user_id}", { message: 'Starting job...' })
        case tool_type
        when "source_dataset"
            docs = fetch_docs_from_dataset(tool_parameters.select{|t| t['name'] == 'dataset'}[0]['value'])
            tool = Tool.find(tool_id)
            tool.results = {docs: docs}
            tool.status = "finished"
            tool.save!
            out = {
              type: "update_experiment_view",
              html: ApplicationController.render(partial: "experiment/tree", locals: {experiment: Experiment.find(tool.experiment.id)}),
              message: 'Done.'
            }
            ActionCable.server.broadcast("notifications.#{user_id}", out)
        when "ngrams"

        else

        end
    end

    def fetch_docs_from_dataset dataset_id
        d = Dataset.find(dataset_id)
        d.fetch_paginated_documents(1, 99, "default", "asc", "all")
    end
end
