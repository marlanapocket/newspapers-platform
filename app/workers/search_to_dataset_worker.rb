class SearchToDatasetWorker
    include Sidekiq::Worker
    include ActionView::Helpers::FormOptionsHelper

    def perform(user_id, dataset_id, search_params)
        puts "### #{search_params}"
        dataset = Dataset.find(dataset_id)
        search_params['fl'] = 'id'
        search_params['facet'] = false
        search_params['rows'] = 100
        search_params['start'] = 0
        doc_ids = []
        res = SolrSearcher.query search_params
        numFound = res['response']['numFound']
        doc_ids.concat res['response']['docs'].map{|d| d['id']}
        while(doc_ids.size < numFound)
            search_params['start'] += 100
            res = SolrSearcher.query search_params
            numFound = res['response']['numFound']
            doc_ids.concat res['response']['docs'].map{|d| d['id']}
        end
        existing = dataset.add_documents doc_ids
        nb_docs_added = doc_ids.size - existing.size
        content = "<p>#{nb_docs_added} document#{nb_docs_added > 1 ? "s were" : " was"} added to your dataset <strong>\"#{dataset.title}\"</strong></p>"
        content.concat "<p>#{existing.size} document#{existing.size > 1 ? "s" : ""} already exist in this dataset.</p>" unless existing.empty?
        # TODO: next line may cause bugs with the working dataset
        dataset_options = options_for_select(User.find(user_id).datasets.map{|d| ["#{d.title} (#{d.documents.size} docs)", d.id]})
        ActionCable.server.broadcast("notifications.#{user_id}", {
          type: "notify",
          html: ApplicationController.render(partial: "shared/notification", locals: {notif_title: dataset.title, notif_content: content}),
          dataset_options: dataset_options })
    end

end