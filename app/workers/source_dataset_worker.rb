class SourceDatasetWorker
    include Sidekiq::Worker

    def perform(tool_id, user_id, experiment_id, tool_type, tool_parameters, continue=false)
        tool = Tool.find(tool_id)
        tool.status = "running"
        tool.save!
        ActionCable.server.broadcast("notifications.#{user_id}", {
          type: "refresh_display",
          html: ApplicationController.render(partial: "experiment/tree", locals: {experiment: Experiment.find(tool.experiment.id)}),
          message: 'Starting job...' })
        docs = fetch_docs_from_dataset(tool_id, experiment_id, user_id, tool_parameters.select{|t| t['name'] == 'dataset'}[0]['value'])
        tool.results = {type:"documents", docs: docs}
        tool.status = "finished"
        tool.save!
        experiment = Experiment.find(tool.experiment.id)
        out = {
          type: "refresh_display",
          html: ApplicationController.render(partial: "experiment/tree", locals: {experiment: experiment}),
          message: 'Done.'
        }
        ActionCable.server.broadcast("notifications.#{user_id}", out)
        if continue
            experiment.continue_from(tool_id)
        end
        if experiment.finished?
            out = {
              type: "experiment_finished",
              message: 'Experiment has finished running.'
            }
            ActionCable.server.broadcast("notifications.#{user_id}", out)
        end
    end

    def fetch_docs_from_dataset(tool_id, experiment_id, user_id, dataset_id)
        d = Dataset.find(dataset_id)
        all_docs = []
        docs = []
        page = 0
        while page == 0 or docs.size == 100
            page += 1
            docs = d.fetch_paginated_documents(page, 100, "default", "asc", "all")[:docs]
            all_docs.concat docs
            out = {
              type: "completion_rate",
              tool_id: tool_id,
              experiment_id: experiment_id,
              completion: d.documents.size == 0 ? 0 : ((all_docs.size.to_f/d.documents.size)*100).to_i
            }
            ActionCable.server.broadcast("notifications.#{user_id}", out)
        end
        all_docs.map do |doc|
            {
              id: doc.id,
              newspaper: doc.newspaper,
              language: doc.language,
              text: doc.all_text,
              date: doc.date_created
            }
        end
    end
end
