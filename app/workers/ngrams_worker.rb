class NgramsWorker
    include Sidekiq::Worker

    def perform(tool_id, user_id, experiment_id, tool_type, tool_parameters, continue=false)
        tool = Tool.find(tool_id)
        tool.status = "running"
        tool.save!
        ActionCable.server.broadcast("notifications.#{user_id}", {
          type: "refresh_display",
          html: ApplicationController.render(partial: "experiment/tree", locals: {experiment: Experiment.find(tool.experiment.id)}),
          message: 'Starting job...' })
        parent_output = Tool.find(tool.parent_id).results
        docs = parent_output["docs"].map{ |doc| doc['text'] }
        n = tool_parameters.select{|t| t['name'] == 'n'}[0]['value'].to_i
        min_freq = tool_parameters.select{|t| t['name'] == 'minimum_frequency'}[0]['value'].to_i
        ngrams = find_ngrams(tool_id, experiment_id, user_id, docs, n, min_freq)
        tool.results = {type:"ngrams", ngrams: ngrams}
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

    def find_ngrams(tool_id, experiment_id, user_id, documents, n, minimum_frequency)
        total = {}
        documents.each_with_index do |document, idx|
            out = {
              type: "completion_rate",
              tool_id: tool_id,
              experiment_id: experiment_id,
              completion: ((idx/(documents.size).to_f)*100).to_i
            }
            ActionCable.server.broadcast("notifications.#{user_id}", out) if idx%20 == 0
            ngrams = document.split.each_cons(n).to_a
            ngrams.reject! { |w1, w2| w1 !~ /^\w+/ || w2 !~ /^\w+/ }
            ngrams.map!{ |ngram| ngram.join(' ') }
            total.merge!( ngrams.each_with_object(Hash.new(0)) do |word, obj|
                obj[word.downcase] += 1
            end)
        end
        total.sort_by { |k, v| -v }.reject { |k, v| v < minimum_frequency }
    end
end
