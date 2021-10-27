import { Controller } from "stimulus"
import {DatasetAPI} from "../utils/dataset_api"
import {SearchAPI} from "../utils/search_api";

export default class extends Controller {
    static targets = [ ]
    static values = { id: Number, nbPages: Number, currentPage: Number, perPage: Number, sort: String, sortOrder: String, selectedDocuments: Array }

    connect() {
        this.loadDocuments(this.idValue, this.currentPageValue, this.perPageValue, this.nbPagesValue, this.sortValue, this.sortOrderValue, "all")
        this.load_named_entities()
    }

    toggleResultSelection(event){
        if(!['A', 'IMG'].includes(event.target.tagName)) {
            $(event.target).parents("div.dataset_document").toggleClass("selected")
        }
    }

    toggleSharingStatus(event) {
        DatasetAPI.toggleSharingStatus(this.idValue, (data) => {
            document.getElementById("dataset-info").outerHTML= data
        })
    }

    export(event) {
        console.log(event)
        DatasetAPI.exportDataset(this.idValue, event.target.dataset["exportType"], (data) => {
            $("#notifications").append(data)
            for(const notif of $('.toast')) {
                const notifToast = bootstrap.Toast.getOrCreateInstance(notif)
                notifToast.show()
                notif.addEventListener('hidden.bs.toast', (event) => {
                    bootstrap.Toast.getOrCreateInstance(event.target).dispose()
                    event.target.remove()
                })
            }
        })
    }

    deleteSelectedDocuments(event) {
        const documentsIds = $(".dataset_document.selected").map((index, document) => {
            return document.getAttribute("data-doc-id")
        }).get()
        DatasetAPI.removeSelectedDocumentsToWorkingDataset(documentsIds, (data)=> {})
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