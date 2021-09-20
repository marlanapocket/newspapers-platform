class SearchToDatasetWorker
    include Sidekiq::Worker
    include ActionView::Helpers::FormOptionsHelper

    def perform(user_id, dataset_id, search_params)
        puts "### #{search_params}"
        dataset = Dataset.find(dataset_id)
        search_params['fl'] = 'id'
        search_params['facet'] = false
        search_params['rows'] = 99999
        doc_ids = SolrSearcher.query search_params
        doc_ids = doc_ids['response']['docs'].map{|d| d['id']}
        dataset.add_documents doc_ids
        content = "<p>#{doc_ids.size} documents were added to your dataset <strong>\"#{dataset.title}\"</strong></p>"
        # TODO: next line may cause bugs with the working dataset
        dataset_options = options_for_select(User.find(user_id).datasets.map{|d| ["#{d.title} (#{d.documents.size} docs)", d.id]})
        ActionCable.server.broadcast("notifications.#{user_id}", {
          type: "notify",
          html: ApplicationController.render(partial: "shared/notification", locals: {notif_title: dataset.title, notif_content: content}),
          dataset_options: dataset_options })
    end

end