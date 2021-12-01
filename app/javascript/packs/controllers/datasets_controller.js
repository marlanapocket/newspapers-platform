import { Controller } from "stimulus"
import { DatasetAPI } from "../utils/dataset_api"

export default class extends Controller {
    static targets = []
    static values = {}

    connect() {
        this.initModals()

        $("body").on("click", ".import_public_dataset", event => {
            console.log(event.target.dataset['datasetId'])
        })
    }

    initModals() {
        $(document).on('shown.bs.modal', "#createDatasetModal", (event) => {
            $("#dataset-title").val("")
            const modalButton = document.getElementById('create-dataset-button')
            modalButton.innerHTML = "Create"
            modalButton.removeAttribute('disabled')
            document.getElementById('dataset-title').focus()
        })

        $(document).on('shown.bs.modal', "#renameDatasetModal", (event) => {
            $("#rename-dataset-title").val("")
            const modalButton = document.getElementById('rename-dataset-button')
            modalButton.innerHTML = "Rename"
            modalButton.removeAttribute('disabled')
            $("#dataset-id").html(event.relatedTarget.getAttribute("data-bs-dataset-id"))
            document.getElementById('rename-dataset-title').focus()
        })

        $(document).on('shown.bs.modal', "#confirmPublicDatasetImportModal", (event) => {
            $("#import-dataset-title").val("")
            const modalButton = document.getElementById('import-dataset-button')
            modalButton.innerHTML = "Import"
            modalButton.removeAttribute('disabled')
            $("#dataset-id").html(event.relatedTarget.getAttribute("data-bs-dataset-id"))
            $("#original-dataset-title").html(event.relatedTarget.getAttribute("data-bs-title"))
            $("#original-dataset-user").html(event.relatedTarget.getAttribute("data-bs-user"))
            document.getElementById('import-dataset-title').focus()
        })
    }

    createDataset(event) {
        $("#message").html("")
        const title = $("#dataset-title").val()
        event.target.setAttribute('disabled', 'disabled')
        event.target.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Loading`
        DatasetAPI.create_dataset(title, (data) => {
            if(data['status'] === 'ok') {
                bootstrap.Modal.getInstance(document.getElementById('createDatasetModal')).hide()
                DatasetAPI.update_datasets_list((data) => {})

            }
            else {
                $("#message").html(data['message'])
                event.target.innerHTML = "Create"
                event.target.removeAttribute('disabled')
            }
        })
    }

    deleteDataset(event) {
        const li = $(event.target).parents("li")
        const datasetId = li.data("dataset-id")
        const datasetName = li.data("dataset-name")
        if (confirm(`Are you sure you want to delete dataset "${datasetName}"`)) {
            DatasetAPI.delete_dataset(datasetId, (data) => {})
        }
    }

    renameDataset(event) {
        $("#message").html("")
        const datasetName = $("#rename-dataset-title").val()
        const datasetId = $("#dataset-id").html()
        event.target.setAttribute('disabled', 'disabled')
        event.target.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Loading`
        DatasetAPI.rename_dataset(datasetId, datasetName, (data) => {
            if(data['status'] === 'ok') {
                bootstrap.Modal.getInstance(document.getElementById('renameDatasetModal')).hide()
                DatasetAPI.update_datasets_list((data) => {})
            }
            else {
                $("#rename-log").html(data['message'])
                event.target.innerHTML = "Rename"
                event.target.removeAttribute('disabled')
            }
        })
    }

    importDataset(event) {
        $("#import-log").html("")
        const originalDatasetId = $("#dataset-id").html()
        const newDatasetName = $("#import-dataset-title").val()
        event.target.setAttribute('disabled', 'disabled')
        event.target.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Loading`
        DatasetAPI.import_dataset(originalDatasetId, newDatasetName, (data) => {
            if(data['status'] === 'ok') {
                bootstrap.Modal.getInstance(document.getElementById('confirmPublicDatasetImportModal')).hide()
                DatasetAPI.update_datasets_list((data) => {})
            }
            else {
                $("#import-log").html(data['message'])
                event.target.innerHTML = "Import"
                event.target.removeAttribute('disabled')
            }
        })
    }
}