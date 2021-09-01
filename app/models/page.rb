class Page

    attr_accessor :id, :page_number, :width, :height, :mime_type, :iiif_url, :ocr_path, :image_path

    def self.from_solr id
        attrs = SolrSearcher.get_doc_by_id id
        p = Page.new
        p.id = attrs['id']
        p.page_number = attrs['page_number_isi']
        p.width = attrs['width_isi']
        p.height = attrs['height_isi']
        p.mime_type = attrs['mime_type_ssi']
        p.iiif_url = attrs['iiif_url_ss']
        p.ocr_path = attrs['ocr_path_ss']
        p.image_path = attrs['image_path_ss'] if attrs['image_path_ss']
        p
    end
end