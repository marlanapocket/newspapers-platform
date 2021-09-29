class CatalogController < ApplicationController

    before_action :authenticate_user!, :strip_input_fields

    def home

    end

    def index
        if params[:q]
            @user_params =
            @solr_params = SolrQuery.new.to_params
            @solr_params[:q] = params[:q]
            @solr_params[:rows] = params[:per_page] if params[:per_page]
            @current_page = params[:page].to_i != 0 ? params[:page].to_i : 1
            @solr_params[:start] = params[:page].to_i != 0 ? @solr_params[:rows] * (params[:page].to_i-1) : 0
            @solr_params[:sort] = params[:sort] if params[:sort]
            if params[:f]
                params[:f].each do |k,v|
                    v.each do |val|
                        @solr_params[:fq] << "#{k}:#{val}"
                    end
                end
            end
            session['search_params'] = @solr_params
            session['query_params'] = params.to_unsafe_h.slice('q', 'page', 'per_page','sort', 'f')
            @results = SolrSearcher.query @solr_params
            @resulting_docs = @results['response']['docs'].map do |solr_doc|
                case solr_doc['has_model_ssim']
                when ['Article']
                    Article.from_solr_doc solr_doc
                when ['Issue']
                    Issue.from_solr_doc solr_doc
                end
            end
            entities_fields = I18n.t("newspapers.solr_fields").values_at(:persons, :locations, :organisations, :human_productions)
            @entities_labels = []
            entities_fields.each do |entity_field|
                (@entities_labels << @results['facets'][entity_field]['buckets'].map{|ne| ne['val']}).flatten! if @results['facets'][entity_field]
            end
            @entities_labels = helpers.get_entity_label @entities_labels
        end
    end

    def show
        if params[:id].include? "_article_"
            @article = Article.from_solr params[:id]
            @issue = Issue.from_solr @article.issue_id, with_pages: true, with_articles: true
        else
            @article = nil
            @issue = Issue.from_solr params[:id], with_pages: true, with_articles: true
        end
    end

    def named_entities_for_doc
        if params[:doc_id].index('_article_').nil?
            named_entities = Issue.named_entities params[:doc_id]
        else
            named_entities = Article.named_entities params[:doc_id]
        end
        render partial: 'named_entities/named_entities', locals: {named_entities: named_entities}
    end

    def named_entities_for_dataset
        dataset = Dataset.find(params[:dataset_id])
        named_entities = dataset.named_entities
        render partial: 'named_entities/named_entities', locals: {named_entities: named_entities}
    end

    def paginate_facets
        out = {}
        if params[:field_name] != ""
            search_params = session['search_params']
            search_params['rows'] = 0
            search_params['json.facet'] = {"#{params[:field_name]}": {terms: {
              field: params[:field_name],
              limit: 15,
              numBuckets: true,
              offset: (params[:current_page].to_i-1) * 15}}}.to_json
            res = SolrSearcher.query search_params
            entities_labels = [res['facets'][params[:field_name]]['buckets'].map{|ne| ne['val']}]
            entities_labels = helpers.get_entity_label entities_labels
            facet_constraints = search_params['fq'].select { |fq| fq.split(':')[0] == params[:field_name] }.map{|fq| {label: params[:field_name], value: fq.split(':')[1]} }
            out[:facets_entries] = []
            res['facets'][params[:field_name]]['buckets'].each do |facet_entry|
                out[:facets_entries] << render_to_string(layout: false, partial: "facet_entry", locals: {
                  entities_labels: entities_labels,
                  facet_constraints: facet_constraints,
                  field: params[:field_name],
                  facet: facet_entry,
                  index: params[:current_page].to_i,
                  per_page: 15
                })
            end

        end
        out[:pagination] = render_to_string(layout: false, partial: 'facet_pagination', locals: {nb_pages: params[:nb_pages].to_i, current_page: params[:current_page].to_i})
        render json: out
    end

    private

    def strip_input_fields
        params.each do |key, value|
            params[key] = value.strip if value.respond_to?("strip")
        end
    end
end
