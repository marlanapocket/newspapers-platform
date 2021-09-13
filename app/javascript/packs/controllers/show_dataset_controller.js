import { Controller } from "stimulus"
import {ServerAPI} from "../utils/server_api"
import {Popover} from "bootstrap"

export default class extends Controller {
    static targets = [ ]
    static values = { id: Number, selected: Boolean }

    connect() {
        console.log("this.idValue", this.idValue)
        this.loadDocuments(this.idValue, 1, 10, "default", "asc", "all")
    }

    loadDocuments(datasetId, page, per_page, sort, sort_order, type) {
        ServerAPI.paginateDataset(datasetId, page, per_page, sort, sort_order, type, (data) => {})
    }

}