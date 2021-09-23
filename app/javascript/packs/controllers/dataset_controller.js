import { Controller } from "stimulus"
import {DatasetAPI} from "../utils/dataset_api"
import {SearchAPI} from "../utils/search_api";

export default class extends Controller {
    static targets = [ ]
    static values = { id: Number, selected: Boolean }

    connect() {
        this.loadDocuments(this.idValue, 1, 10, "default", "asc", "all")
        this.load_named_entities()
    }

    loadDocuments(datasetId, page, per_page, sort, sort_order, type) {
        DatasetAPI.paginateDataset(datasetId, page, per_page, sort, sort_order, type, (data) => {})
    }

    load_named_entities() {
        SearchAPI.load_dataset_named_entities(this.idValue, (data) => {
            $('#named-entities-panel').find(".card-body").html(data)
        })
    }

}