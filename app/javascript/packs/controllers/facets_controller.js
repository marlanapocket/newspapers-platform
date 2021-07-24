import { Controller } from "stimulus"

export default class extends Controller {
    static targets = [ "pageButton", "nextButton", 'previousButton', 'item' ]
    static values = { index: Number, pages: Number, perPage: Number }

    initialize() {
    }

    connect() {
        this.generatePagination()
    }

    previous_page(event) {
        event.preventDefault()
        if (this.indexValue > 1) {
            this.indexValue--
            this.updatePagination()
        }
    }

    next_page(event) {
        event.preventDefault()
        if (this.indexValue < this.pagesValue)
            this.indexValue++
        this.updatePagination()
    }

    page_button(event) {
        event.preventDefault()
        this.indexValue = event.target.textContent
        this.updatePagination()

    }

    updatePagination() {
        this.itemTargets.forEach( (item, item_index) => {
            item.hidden = !(item_index >= ((this.indexValue-1) * this.perPageValue) && item_index < (this.indexValue * this.perPageValue))
        })
        this.generatePagination()
    }

    generatePagination() {
        if (this.pagesValue > this.perPageValue) {
            const nav = document.createElement('nav')
            const ul = document.createElement('ul')
            ul.setAttribute('class', 'pagination pagination-sm justify-content-center')
            nav.appendChild(ul)

            const prev = document.createElement('li')
            prev.setAttribute("data-facets-target", "previousButton")
            prev.setAttribute('data-action', "click->facets#previous_page")
            prev.setAttribute('class', "page-item")
            if (this.indexValue === 1)
                prev.classList.add("disabled")
            let a = document.createElement("a")
            a.setAttribute('class', 'page-link')
            a.setAttribute('href', '#')
            a.appendChild(document.createTextNode("\u00AB"))
            prev.appendChild(a)
            ul.appendChild(prev)

            if (this.pagesValue > 10) {
                for (let i=1; i <= this.pagesValue; i++) {
                    if ( (i >= this.indexValue-2 && i <= this.indexValue+2) || i <= 1 || i >= this.pagesValue) {
                        const pageButton = document.createElement('li')
                        pageButton.setAttribute("data-facets-target", "pageButton")
                        pageButton.setAttribute('data-action', "click->facets#page_button")
                        pageButton.setAttribute('class', "page-item")
                        if (this.indexValue === i)
                            pageButton.classList.add("active")
                        a = document.createElement("a")
                        a.setAttribute('class', 'page-link')
                        a.setAttribute('href', '#')
                        a.appendChild(document.createTextNode(i+""))
                        pageButton.appendChild(a)
                        ul.appendChild(pageButton)
                    }
                    else if ( (i === 2 && this.indexValue >= 5) || (i === this.pagesValue-1 && this.indexValue <= this.pagesValue-4) ) {
                        const skipButton = document.createElement('li')
                        skipButton.setAttribute("data-facets-target", "pageButton")
                        skipButton.setAttribute('data-action', "click->facets#page_button")
                        skipButton.setAttribute('class', "page-item disabled")
                        a = document.createElement("a")
                        a.setAttribute('class', 'page-link')
                        a.setAttribute('href', '#')
                        a.appendChild(document.createTextNode("..."))
                        skipButton.appendChild(a)
                        ul.appendChild(skipButton)
                    }
                }
            }
            else {
                for (let i=1; i <= this.pagesValue; i++) {
                    const pageButton = document.createElement('li')
                    pageButton.setAttribute("data-facets-target", "pageButton")
                    pageButton.setAttribute('data-action', "click->facets#page_button")
                    pageButton.setAttribute('class', "page-item")
                    if (this.indexValue === i)
                        pageButton.classList.add("active")
                    a = document.createElement("a")
                    a.setAttribute('class', 'page-link')
                    a.setAttribute('href', '#')
                    a.appendChild(document.createTextNode(i+""))
                    pageButton.appendChild(a)
                    ul.appendChild(pageButton)
                }
            }

            const next = document.createElement('li')
            next.setAttribute("data-facets-target", "nextButton")
            next.setAttribute('data-action', "click->facets#next_page")
            next.setAttribute('class', "page-item")
            if (this.indexValue === this.pagesValue)
                next.classList.add("disabled")
            a = document.createElement("a")
            a.setAttribute('class', 'page-link')
            a.setAttribute('href', '#')
            a.appendChild(document.createTextNode("\u00BB"))
            next.appendChild(a)
            ul.appendChild(next)

            this.element.querySelector("div.facet_pagination").innerHTML = nav.outerHTML
        }
    }
}