import { Controller } from "stimulus"
import { SearchAPI } from "../utils/search_api"

export default class extends Controller {
    static targets = [ "pageButton", "nextButton", 'previousButton', 'item' ]
    static values = { index: Number, nbPages: Number, perPage: Number }

    initialize() {
    }

    connect() {
        this.generatePagination(false)
    }

    previous_page(event) {
        event.preventDefault()
        if (this.indexValue > 1) {
            this.indexValue--
            this.generatePagination()
        }
    }

    next_page(event) {
        event.preventDefault()
        if (this.indexValue < this.nbPagesValue)
            this.indexValue++
        this.generatePagination()
    }

    page_button(event) {
        // $(this.element).find("ul.list-unstyled")[0].innerHTML = "<div class=\"spinner-border\"></div>"
        event.preventDefault()
        this.indexValue = event.target.textContent
        this.generatePagination()

    }

    generatePagination(generateFacets=true) {
        if(generateFacets) {
            const entity_field = this.element.parentElement.getAttribute('id').substring("facet_collapse_".length)
            SearchAPI.facetPagination(entity_field, this.nbPagesValue, this.indexValue, (data) => {
                $(this.element).find("ul.list-unstyled")[0].innerHTML = data['facets_entries'].join("")
                $(this.element).find(".facet_pagination")[0].innerHTML = data['pagination']
            })
        }
        else if(this.nbPagesValue > 1) {
            SearchAPI.facetPagination(null, this.nbPagesValue, this.indexValue, (data) => {
                $(this.element).find(".facet_pagination")[0].innerHTML = data['pagination']
            })
        }
    }
}