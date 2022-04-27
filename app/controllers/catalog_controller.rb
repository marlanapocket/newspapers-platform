class CatalogController < ApplicationController

    before_action :authenticate_user!, :strip_input_fields

    def home

    end

    ##
    # Creates a search query and submit it to the index. Retrieve and displays results + metadata.
    def index
        if params[:q]
            @search_type = params[:search_type].nil? ? "exact" : params[:search_type]
            @solr_params = SolrQuery.new(@search_type).to_params
            @solr_params[:q] = params[:q]
            @solr_params[:rows] = params[:per_page] if params[:per_page]
            @current_page = params[:page].to_i != 0 ? params[:page].to_i : 1
            @solr_params[:start] = params[:page].to_i != 0 ? @solr_params[:rows] * (params[:page].to_i-1) : 0
            @solr_params[:sort] = params[:sort] if params[:sort]
            if params[:f]
                params[:f].each do |k,v|
                    if k == "date_created_dtsi"  # v is a hash {to: "", from: ""}
                        @solr_params[:fq] << "#{k}:[#{v['from']}T00:00:00Z TO #{v['to']}T00:00:00Z]"
                    else
                        if v.is_a? Array
                            v.each do |val|
                                @solr_params[:fq] << "#{k}:#{val}"
                            end
                        end
                    end
                end
            end
            session['search_params'] = @solr_params
            session['query_params'] = params.to_unsafe_h.slice('q', 'page', 'per_page','sort', 'f')
            @results = SolrSearcher.query @solr_params
            puts @results.to_json if Rails.env == "development"
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

    ##
    # Display an issue
    def show
        @issue = Issue.from_solr params[:id], with_pages=true, with_articles=true
        session['named_entities'] = Issue.named_entities @issue.id
        session['named_entities_labels'] = helpers.get_linked_entities session['named_entities'].map{ |k,v| v.keys }.flatten.uniq
    end

    ##
    # Retrieve named entities for a list of documents (issue and/or articles)
    def named_entities_for_docs
        named_entities = {LOC: {}, PER: {}, ORG: {}, HumanProd: {}}
        params[:docs_ids].each do |doc_id|
            if doc_id.index('_article_').nil?
                doc_named_entities = session['named_entities']
            else # if article, filter stored list
                doc_named_entities = session['named_entities'].map{ |ne_type, ne_list|
                    [ne_type,ne_list.select{ |linked_id, namedentities|
                        namedentities.any?{ |ne|
                            ne['article_id_ssi'] == doc_id
                        }
                    }.map{ |k,v| [k,v.select{ |ne| ne['article_id_ssi'] == doc_id }] }.to_h]
                }.to_h
            end
            named_entities[:LOC] = named_entities[:LOC].merge(doc_named_entities[:LOC]) do |key,oldval,newval|
                oldval.concat newval
            end
            named_entities[:ORG] = named_entities[:ORG].merge(doc_named_entities[:ORG]) do |key,oldval,newval|
                oldval.concat newval
            end
            named_entities[:PER] = named_entities[:PER].merge(doc_named_entities[:PER]) do |key,oldval,newval|
                oldval.concat newval
            end
            named_entities[:HumanProd] = named_entities[:HumanProd].merge(doc_named_entities[:HumanProd]) do |key,oldval,newval|
                oldval.concat newval
            end
        end
        render partial: 'named_entities/named_entities', locals: {named_entities: named_entities, linked_entities: session['named_entities_labels']}
    end

    ##
    # Retrieve named entities for a dataset
    def named_entities_for_dataset
        dataset = Dataset.find(params[:dataset_id])
        named_entities = dataset.named_entities
        named_entities_labels = helpers.get_linked_entities named_entities.map{ |k,v| v.keys }.flatten.uniq
        render partial: 'named_entities/named_entities', locals: {named_entities: named_entities, linked_entities: named_entities_labels}
    end

    ##
    # Retrieve and display paginated facets
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

    ##
    # Open modal for date frequencies histogram in wide format
    def wide_dates_histogram
        out = {}
        out[:modal_content] = render_to_string(layout: false, partial: "wide_dates_histogram")
        render json: out
    end

    ##
    # Open Modal to confirm the creation of a compound article
    def confirm_compound_creation
        out = {}
        out[:modal_content] = render_to_string(layout: false, partial: "confirm_compound_creation", locals: {article_parts: params[:article_parts]})
        render json: out
    end

    ##
    # Create a new compound article
    def create_compound
        compound = CompoundArticle.new
        compound.user = current_user
        compound.title = params[:title]
        compound.issue_id = params[:issue_id]
        issue = Issue.from_solr params[:issue_id]
        compound.newspaper = issue.newspaper
        compound.date_created = issue.date_created
        compound.thumbnail_url = issue.thumbnail_url
        compound.language = issue.language
        compound.all_text = params[:all_text]
        compound.parts = params[:article_parts_ids]
        begin
            compound.save!
            render json: {status: 'ok', html: render_to_string(layout: false, partial: "compound_articles_panel", locals: {issue_id: params[:issue_id]})}
        rescue ActiveRecord::RecordNotUnique
            render json: {status: "error", message: "A compound article with this title already exists."}
        rescue ActiveRecord::RecordInvalid
            render json: {status: "error", message: "The title should not be blank."}
        end
    end

    ##
    # Delete an existing compound
    def delete_compound
        compound = CompoundArticle.find(params[:compound_id])
        issue_id = compound.issue_id
        current_user.datasets.each do |dataset|
            if dataset.documents.any?{|doc| doc['id'].to_s == compound.id.to_s}
                dataset.documents = dataset.documents.select{|doc| doc['id'].to_s != compound.id.to_s}
                dataset.save!
            end
        end
        compound.destroy
        out = {}
        out[:html] = render_to_string(layout: false, partial: "compound_articles_panel", locals: {issue_id: issue_id})
        out[:datasets] = render_to_string(layout: false, partial: "manage_datasets_content_show_page")
        render json: out
    end

    ##
    # Retrieve and display a random sample of the result of a search
    def random_sample
        search_params = session['search_params'].with_indifferent_access
        search_params[:fq] = search_params[:fq].select {|elt| !elt.start_with? "has_model_ssim:" } if search_params[:fq]
        search_params[:fq] ||= []
        search_params[:fq] << "has_model_ssim:Article"
        search_params[:sort] = "rand#{(0...8).map { (65 + rand(26)).chr }.join} asc"
        results = SolrSearcher.query search_params
        results = results['response']['docs'].map do |solr_doc|
            case solr_doc['has_model_ssim']
            when ['Article']
                Article.from_solr_doc solr_doc
            when ['Issue']
                Issue.from_solr_doc solr_doc
            end
        end
        render json: {content: render_to_string(layout: false, partial: "random_sample", locals: {resulting_docs: results}) }
    end

    private

    def strip_input_fields
        params.each do |key, value|
            params[key] = value.strip if value.respond_to?("strip")
        end
    end
end
