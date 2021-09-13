import { Controller } from "stimulus"
import {ServerAPI} from "../utils/server_api"
import {Popover} from "bootstrap"
import {Toast} from "bootstrap"

export default class extends Controller {
    static targets = [ ]
    static values = { selected: Boolean }

    connect() {
        $('[data-toggle="popover"]').popover({
            trigger: "hover"
        })
    }

    toggleResultSelection(event){
        if(!['A', 'IMG'].includes(event.target.tagName)) {
            $(event.target).parents("div.search_result").toggleClass("selected")
        }
    }

    selectWorkingDataset(event) {
        const datasetID = parseInt($(event.target).find("option:selected").val())
        ServerAPI.setCurrentWorkingDataset(datasetID, (data) => {})
    }

    addSelectedDocumentsToWorkingDataset(event) {
        const documentsIds = $(".search_result.selected").map((index, document) => {
            return document.getAttribute("data-doc-id")
        }).get()
        ServerAPI.addSelectedDocumentsToWorkingDataset(documentsIds, (data)=> {})
    }

}