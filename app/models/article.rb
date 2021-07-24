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
        a.canvases_parts = solr_doc['canvases_parts_ssm']
        a.bbox = a.get_location
        a
    end

    def get_thumbnail_url manifest
        canvas_url = self.canvases_parts[0]
        coords = self.canvases_parts.map { |c| c[c.rindex('#xywh=')+6..-1].split(',').map(&:to_i) }
        min_x = coords.map{ |coord| coord[0] }.min
        max_x = coords.map{ |coord| coord[0] + coord[2] }.max
        min_y = coords.map{ |coord| coord[1] }.min
        max_y = coords.map{ |coord| coord[1] + coord[3] }.max
        pagenum = canvas_url[canvas_url.rindex('_')+1...canvas_url.rindex('#')].to_i
        "#{manifest['sequences'][0]['canvases'][pagenum-1]['images'][0]['resource']['service']['@id']}/#{min_x},#{min_y},#{max_x-min_x},#{max_y-min_y}/!400,200/0/default.jpg"
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
end