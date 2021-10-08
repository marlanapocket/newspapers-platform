import { Controller } from "stimulus"
import {DatasetAPI} from "../utils/dataset_api"
import {SearchAPI} from "../utils/search_api";

export default class extends Controller {
    static targets = [ ]
    static values = { id: Number, nbPages: Number, currentPage: Number, perPage: Number, sort: String, sortOrder: String }

    connect() {
        this.loadDocuments(this.idValue, this.currentPageValue, this.perPageValue, this.nbPagesValue, this.sortValue, this.sortOrderValue, "all")
        this.load_named_entities()
    }

    loadDocuments(datasetId, page, per_page, nb_pages, sort, sort_order, type) {
        DatasetAPI.paginateDataset(datasetId, page, per_page, nb_pages, sort, sort_order, type, (data) => {
            $("#documents-list").html(data.documents)
            $("#results_navigation").html(data.pagination)
        })
    }

    load_named_entities() {
        SearchAPI.load_dataset_named_entities(this.idValue, (data) => {
            $('#named-entities-panel').find(".card-body").html(data)
        })
    }

    previous_page(event) {
        event.preventDefault()
        if (this.currentPageValue > 1) {
            this.currentPageValue--
            this.loadDocuments(this.idValue, this.currentPageValue, this.perPageValue, this.nbPagesValue, this.sortValue, this.sortOrderValue, "all")
        }
    }

    next_page(event) {
        event.preventDefault()
        if (this.currentPageValue < this.nbPagesValue) {
            this.currentPageValue++
            this.loadDocuments(this.idValue, this.currentPageValue, this.perPageValue, this.nbPagesValue, this.sortValue, this.sortOrderValue, "all")
        }
    }

    page_button(event) {
        event.preventDefault()
        this.currentPageValue = event.target.textContent
        this.loadDocuments(this.idValue, this.currentPageValue, this.perPageValue, this.nbPagesValue, this.sortValue, this.sortOrderValue, "all")
    }

}