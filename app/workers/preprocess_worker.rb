class PreprocessWorker
    include Sidekiq::Worker

    def perform(tool_id, user_id, experiment_id, tool_type, tool_parameters)
        tool = Tool.find(tool_id)
        tool.status = "running"
        tool.save!
        ActionCable.server.broadcast("notifications.#{user_id}", {
          type: "refresh_display",
          html: ApplicationController.render(partial: "experiment/tree", locals: {experiment: Experiment.find(tool.experiment.id)}),
          message: 'Starting job...' })
        parent_output = Tool.find(tool.parent_id).results
        docs = parent_output["docs"]
        docs = docs.each_with_index.map do |doc, idx|
            out = {
              type: "completion_rate",
              tool_id: tool.id,
              experiment_id: experiment_id,
              completion: ((idx/(docs.size-1).to_f)*100).to_i
            }
            ActionCable.server.broadcast("notifications.#{user_id}", out) if idx%20 == 0

            doc['text'] = PragmaticTokenizer::Tokenizer.new(
              language: doc['language'],
              remove_stop_words: tool_parameters.select{|t| t['name'] == 'stopwords'}[0]['value'],
              punctuation: tool_parameters.select{|t| t['name'] == 'punctuation'}[0]['value'] ? "none" : "all",
              numbers: tool_parameters.select{|t| t['name'] == 'lowercase'}[0]['value'] ? "none" : "all",
              clean: true,
              downcase: tool_parameters.select{|t| t['name'] == 'lowercase'}[0]['value'],
              minimum_length: 3
            ).tokenize(doc['text']).join(' ')
            doc
        end
        tool.results = {type:"documents", docs: docs}
        tool.status = "finished"
        tool.save!
        out = {
          type: "refresh_display",
          html: ApplicationController.render(partial: "experiment/tree", locals: {experiment: Experiment.find(tool.experiment.id)}),
          message: 'Done.'
        }
        ActionCable.server.broadcast("notifications.#{user_id}", out)
    end
end
