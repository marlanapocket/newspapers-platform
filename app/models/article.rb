class Article

    attr_accessor :id, :title, :all_text, :date_created, :language, :canvases_parts, :newspaper, :issue_id, :thumbnail_url, :bbox

    def self.from_solr id
        solr_doc = SolrSearcher.get_doc_by_id id
        Article.from_solr_doc solr_doc
    end

    def self.from_solr_doc solr_doc
        a = Article.new
        a.id = solr_doc['id']
        a.title = solr_doc['title_ssi']
        a.language = solr_doc['language_ssi']
        a.all_text = solr_doc["all_text_t#{a.language}_siv"]
        a.date_created = solr_doc['date_created_ssi']
        a.issue_id = solr_doc['from_issue_ssi']
        a.newspaper = solr_doc['member_of_collection_ids_ssim'].first
        a.thumbnail_url = solr_doc['thumbnail_url_ss']
        a.canvases_parts = solr_doc['canvases_parts_ssm']
        a.bbox = a.get_location
        a
    end

    def get_location
        coords = self.canvases_parts.map { |c| c[c.rindex('#xywh=')+6..-1].split(',').map(&:to_i) }
        min_x = coords.map{ |coord| coord[0] }.min
        max_x = coords.map{ |coord| coord[0] + coord[2] }.max
        min_y = coords.map{ |coord| coord[1] }.min
        max_y = coords.map{ |coord| coord[1] + coord[3] }.max
        canvas_coords = [min_x, max_x, min_y, max_y]
        canvas_size = [canvas_coords[1]-canvas_coords[0], canvas_coords[3]-canvas_coords[2]]
        [min_x,min_y,canvas_size[0],canvas_size[1]]
    end

    def self.named_entities(article_id)
        nems = SolrSearcher.query({q:"article_id_ssi:#{article_id}", rows: 1000000})['response']['docs']
        output = {LOC: {}, PER: {}, ORG: {}, HumanProd: {}}
        nems.select {|ne_solr| ne_solr['type_ssi'] == "LOC"}.each do |ne_solr|
            output[:LOC][ne_solr['linked_entity_ssi']] = [] unless output[:LOC].has_key? ne_solr['linked_entity_ssi']
            output[:LOC][ne_solr['linked_entity_ssi']].append(ne_solr)
        end
        nems.select {|ne_solr| ne_solr['type_ssi'] == "PER"}.each do |ne_solr|
            output[:PER][ne_solr['linked_entity_ssi']] = [] unless output[:PER].has_key? ne_solr['linked_entity_ssi']
            output[:PER][ne_solr['linked_entity_ssi']].append(ne_solr)
        end
        nems.select {|ne_solr| ne_solr['type_ssi'] == "ORG"}.each do |ne_solr|
            output[:ORG][ne_solr['linked_entity_ssi']] = [] unless output[:ORG].has_key? ne_solr['linked_entity_ssi']
            output[:ORG][ne_solr['linked_entity_ssi']].append(ne_solr)
        end
        nems.select {|ne_solr| ne_solr['type_ssi'] == "HumanProd"}.each do |ne_solr|
            output[:HumanProd][ne_solr['linked_entity_ssi']] = [] unless output[:HumanProd].has_key? ne_solr['linked_entity_ssi']
            output[:HumanProd][ne_solr['linked_entity_ssi']].append(ne_solr)
        end
        output
    end
end