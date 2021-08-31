import { Controller } from "stimulus"

export default class extends Controller {
    static targets = [ "pageButton", "nextButton", 'previousButton' ]
    static values = { index: Number, pages: Number, total: Number }

    initialize() {
    }

    connect() {
    }

    updatePagination() {
        self = this
        const csrfToken = document.querySelector("[name='csrf-token']").content
        fetch(window.location.protocol + "//" + window.location.host + "/paginate_results",
            {
                headers: { "X-CSRF-Token": csrfToken, "Content-Type": "application/json; charset=utf-8" },
                method: "POST",
                body: JSON.stringify({
                    page: this.indexValue,
                    per_page: 10,
                    total: this.totalValue
                })
            })
            .then(function(res){
                return res.text()
            })
            .then(function(data){
                document.querySelector("#results_navigation").innerHTML =  data
                const url = new URL(window.location)
                url.searchParams.set('page', self.indexValue)
            })
    }
}