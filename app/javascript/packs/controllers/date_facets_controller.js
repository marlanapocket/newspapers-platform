import { Controller } from "stimulus"
import { SearchAPI } from "../utils/search_api"

export default class extends Controller {
    static targets = [ ]
    static values = { maxDate: String, minDate: String }

    initialize() {

    }

    connect() {
    }

    submit(event) {
        console.log(event)
    }

    from_date_changed(event) {
        const date_value = $("#date_facet_from").val()
        if(date_value == "") {
            $("#date_facet_to").attr('min', this.minDateValue)
            $("#date_facet_from").val(this.minDateValue)
        }
        else
            $("#date_facet_to").attr('min', date_value)
    }

    to_date_changed(event) {
        const date_value = $("#date_facet_to").val()
        if(date_value == "") {
            $("#date_facet_from").attr('max', this.maxDateValue)
            $("#date_facet_to").val(this.maxDateValue)
        }
        else
            $("#date_facet_from").attr('max', date_value)
    }
}