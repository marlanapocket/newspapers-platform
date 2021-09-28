import { Controller } from "stimulus"
import { DatasetAPI } from "../utils/dataset_api"

export default class extends Controller {
    static targets = []
    static values = {}

    connect() {
        this.initModal()
    }

    initModal() {
        const modal = document.getElementById('createDatasetModal')
        const modalButton = document.getElementById('create-dataset-button')
        modal.addEventListener('hidden.bs.modal', (event) => {
            $("#dataset-title").val("")
            modalButton.innerHTML = "Create"
            modalButton.removeAttribute('disabled')
            $(document.body).removeClass("modal-open")
            $(".modal-backdrop").remove()
        })
        modal.addEventListener('shown.bs.modal', (event) => {
            document.getElementById('dataset-title').focus()
        })
    }

    createDataset(event) {
        $("#message").html("")
        const title = $("#dataset-title").val()
        event.target.setAttribute('disabled', 'disabled')
        event.target.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading`
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
        const datasetId = event.target.parentElement.dataset['datasetId']
        const datasetName = event.target.parentElement.dataset['datasetName']
        if (confirm(`Are you sure you want to delete dataset "${datasetName}"`)) {
            DatasetAPI.delete_dataset(datasetId, (data) => {})
        }
    }
}