import { Controller } from "stimulus"
import {ServerAPI} from "../utils/server_api"

export default class extends Controller {
    static targets = []
    static values = {}

    connect() {
        this.initModal()
    }

    initModal() {
        const modal = document.getElementById('createExperimentModal')
        const modalButton = document.getElementById('create-experiment-button')
        modal.addEventListener('hidden.bs.modal', (event) => {
            $("#experiment-title").val("")
            modalButton.innerHTML = "Create"
            modalButton.removeAttribute('disabled')
            $(document.body).removeClass("modal-open")
            $(".modal-backdrop").remove()
        })
        modal.addEventListener('shown.bs.modal', (event) => {
            document.getElementById('experiment-title').focus()
        })
    }

    createExperiment(event) {
        $("#message").html("")
        const title = $("#experiment-title").val()
        event.target.setAttribute('disabled', 'disabled')
        event.target.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading`
        ServerAPI.create_experiment(title, (data) => {
            if(data['status'] === 'ok') {
                //close modal + update list
                bootstrap.Modal.getInstance(document.getElementById('createExperimentModal')).hide()
                ServerAPI.update_experiments_list((data) => {})

            }
            else {
                $("#message").html(data['message'])
                event.target.innerHTML = "Create"
                event.target.removeAttribute('disabled')
            }
        })
    }
}