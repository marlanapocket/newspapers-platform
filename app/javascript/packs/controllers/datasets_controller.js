import { Controller } from "stimulus"
import {ServerAPI} from "../utils/server_api"

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
        ServerAPI.create_dataset(title, (data) => {
            if(data['status'] === 'ok') {
                //close modal + update list
                bootstrap.Modal.getInstance(document.getElementById('createDatasetModal')).hide()
                ServerAPI.update_datasets_list((data) => {})

            }
            else {
                $("#message").html(data['message'])
                event.target.innerHTML = "Create"
                event.target.removeAttribute('disabled')
            }
        })
    }
}