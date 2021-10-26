import { Controller } from "stimulus"
import { SearchAPI } from "../utils/search_api"
import {DatasetAPI} from "../utils/dataset_api";

export default class extends Controller {
    static targets = ['currentPage', 'articleOverlay', 'selectedArticlePanel', 'addArticleButton']
    static values = {currentPage: Number, nbpages: Number, pages: Array, articles: Array, selectedArticles: Array, issueId: String}

    isDragged = false
    viewer = null

    connect() {
        const selectedParam = (new URL(window.location.href)).searchParams.get('selected')
        if (selectedParam == null) {
            this.selectedArticlesValue = []
        }
        else {
            this.selectedArticlesValue = [selectedParam]
        }
        this.setup_viewer()
        this.load_named_entities((this.selectedArticlesValue.length == 0) ? this.issueIdValue : this.selectedArticlesValue[0])
        this.setup_mention_click()
    }

    setup_mention_click() {
        $('#named-entities-panel').on("click", ".entity_mention", (event) => {
            let articleId = event.target.dataset['articleId']
            // Go to article page and select it
            let article = this.articlesValue.filter((obj) => { return obj["id"] == articleId})[0]
            let pagenum = article.canvases_parts[0]
            pagenum = parseInt(pagenum.substring(pagenum.lastIndexOf('_')+1, pagenum.lastIndexOf("#xywh")))
            // this.viewer.goToPage(pagenum)
            // this.viewer.viewport.zoomTo(2)
            // this.viewer.viewport.panTo(new OpenSeadragon.Point(loc.x+loc.width/2, loc.y+loc.height/2))
        })
    }

    article_clicked(event) {
        if(this.isDragged) {
            this.isDragged = false
        }
        else {
            this.hide_mask()
            const articleId = event.target.getAttribute('id')
            // If the article is already selected
            if(this.selectedArticlesValue.includes(articleId)) {
                $(this.addArticleButtonTarget).addClass("d-none")
                $('#named-entities-panel').find(".card-body").html("<div class='spinner-border'></div>")
                this.load_named_entities(this.issueIdValue)
                $(event.target).removeClass("article_overlay_selected").addClass("article_overlay")
                this.selectedArticlesValue = this.selectedArticlesValue.filter(item => item !== $(event.target).attr('id'))
                // Change url param for selected article
                if (window.history.replaceState) {
                    let url = new URL(window.location.href)
                    url.searchParams.delete('selected')
                    window.history.replaceState(null, '', url.toString())
                }
            }
            else {  // If the article is not yet selected
                $(this.addArticleButtonTarget).removeClass("d-none")
                $('#named-entities-panel').find(".card-body").html("<div class='spinner-border'></div>")
                this.load_named_entities(articleId)
                $(".article_overlay_selected").removeClass("article_overlay_selected").addClass("article_overlay")
                $(event.target).addClass("article_overlay_selected").removeClass("article_overlay")
                this.selectedArticlesValue = [$(event.target).attr('id')]
                this.display_mask($(event.target).data('loc'))
                // Change url param for selected article
                if (window.history.replaceState) {
                    let url = new URL(window.location.href)
                    url.searchParams.set('selected', event.target.getAttribute('id'))
                    window.history.replaceState(null, '', url.toString())
                }
            }
            this.updateSelectedArticlePanel()
        }
    }

    updateSelectedArticlePanel() {
        if(this.selectedArticlesValue.length == 0) {
            this.selectedArticlePanelTarget.hidden = true
        }
        else {
            this.selectedArticlePanelTarget.hidden = false
            const text = $.map(this.selectedArticlesValue, (article_id, idx) => {
                return $(`#${article_id}`).data('text').replaceAll("\"", "").replaceAll("\\n", "<br/>")
            }).join("\n")
            const title = this.selectedArticlesValue.length == 1 ? this.selectedArticlesValue[0] : "Compound"
            $(this.selectedArticlePanelTarget).find('h5')[0].innerHTML = title
            $(this.selectedArticlePanelTarget).find('p')[0].innerHTML = text
        }

    }

    load_named_entities(docId) {
        SearchAPI.load_named_entities(docId, (data) => {
            $('#named-entities-panel').find(".card-body").html(data)
        })
    }

    toggleResultSelection(event){
        if(!['A', 'IMG'].includes(event.target.tagName)) {
            $(event.target).parents("div.search_result").toggleClass("selected")
        }
    }

    selectWorkingDataset(event) {
        const datasetID = parseInt($(event.target).find("option:selected").val())
        DatasetAPI.setCurrentWorkingDataset(datasetID, (data) => {})
    }

    addSelectedArticleToWorkingDataset(event) {
        DatasetAPI.addSelectedDocumentsToWorkingDataset(this.selectedArticlesValue, (data)=> {
            $("#notifications").append(data['notif'])
            for(const notif of $('.toast')) {
                const notifToast = bootstrap.Toast.getOrCreateInstance(notif)
                notifToast.show()
                notif.addEventListener('hidden.bs.toast', (event) => {
                    bootstrap.Toast.getOrCreateInstance(event.target).dispose()
                    event.target.remove()
                })
            }
            // Find dataset in list and change nb docs
            const option = $("#working_dataset_select").find(":selected")
            option.html(`${data['title']} (${data['nbdocs']} docs)`)
            //unselect all docs
            $("div.search_result").removeClass("selected")
        })
    }

    addEntireIssueToWorkingDataset(event) {
        DatasetAPI.addSelectedDocumentsToWorkingDataset([this.issueIdValue], (data)=> {
            $("#notifications").append(data['notif'])
            for(const notif of $('.toast')) {
                const notifToast = bootstrap.Toast.getOrCreateInstance(notif)
                notifToast.show()
                notif.addEventListener('hidden.bs.toast', (event) => {
                    bootstrap.Toast.getOrCreateInstance(event.target).dispose()
                    event.target.remove()
                })
            }
            // Find dataset in list and change nb docs
            const option = $("#working_dataset_select").find(":selected")
            option.html(`${data['title']} (${data['nbdocs']} docs)`)
            //unselect all docs
            $("div.search_result").removeClass("selected")
        })
    }

    setup_viewer() {
        const selectedArticleObject = this.articlesValue.filter((elt)=>{return elt.id == this.selectedArticlesValue[0]})[0]
        let initialPage = null
        if(selectedArticleObject == undefined) {
            initialPage = 0
            $(this.addArticleButtonTarget).addClass("d-none")
        }
        else {
            $(this.addArticleButtonTarget).removeClass("d-none")
            const pagenum = selectedArticleObject.canvases_parts[0]
            initialPage = parseInt(pagenum.substring(pagenum.lastIndexOf('_')+1, pagenum.lastIndexOf("#xywh")))-1
        }
        this.viewer = OpenSeadragon({
            id: "openseadragon_view",
            prefixUrl: "/openseadragon/images/",
            sequenceMode: true,
            initialPage: initialPage,
            tileSources: this.pagesValue,
            showFullPageControl: false
        })

        // Set the page counter on the osd viewer
        this.currentPageValue = this.viewer.currentPage()+1
        this.currentPageTarget.innerHTML = this.currentPageValue

        // Handler when the current page is changed
        this.viewer.addHandler("page", (data) => {
            this.currentPageValue = data.page + 1
            this.currentPageTarget.innerHTML = this.currentPageValue
            $('#named-entities-panel').find(".card-body").html("<div class='spinner-border'></div>")
            this.load_named_entities(this.issueIdValue)
            this.selectedArticlesValue = []
            if (window.history.replaceState) {
                let url = new URL(window.location.href)
                url.searchParams.delete('selected')
                window.history.replaceState(null, '', url.toString())
            }
        })

        // Handler when a page is open (when landing on page and after a page change)
        this.viewer.addHandler("open", (data) => {
            for (let article of this.articlesValue) {
                let pagenum = article.canvases_parts[0]
                pagenum = parseInt(pagenum.substring(pagenum.lastIndexOf('_')+1, pagenum.lastIndexOf("#xywh")))
                if (pagenum === this.currentPageValue) {
                    let bbox = article.bbox
                    let loc = this.viewer.viewport.imageToViewportRectangle(bbox[0], bbox[1], bbox[2], bbox[3])
                    let article_class = null
                    if(this.selectedArticlesValue[0] == article.id) {
                        this.display_mask(loc)
                        article_class = "article_overlay_selected"
                    }
                    else {
                        article_class = "article_overlay"
                    }
                    let elt = $(`<div id="${article.id}" class="${article_class}"></div>`)
                    elt.attr("data-viewer-target", "articleOverlay")
                    elt.attr("data-action", "click->viewer#article_clicked")
                    elt.attr("data-loc", JSON.stringify({'x': loc.x, 'y': loc.y, 'width': loc.width, 'height': loc.height}))
                    elt.attr("data-text", JSON.stringify(article.all_text))
                    this.viewer.addOverlay({element: elt[0], location: loc})
                    this.setOSDDragHandler(elt[0])
                }
            }
            this.updateSelectedArticlePanel()
        })
    }

    display_mask(overlay_loc) {
        let maskN = $("<div id=\"mask_north\" class=\"selection_mask\"></div>")
        let maskE = $("<div id=\"mask_east\" class=\"selection_mask\"></div>")
        let maskS = $("<div id=\"mask_south\" class=\"selection_mask\"></div>")
        let maskW = $("<div id=\"mask_west\" class=\"selection_mask\"></div>")
        let locN = new OpenSeadragon.Rect(0, 0, overlay_loc.x+overlay_loc.width, overlay_loc.y)
        let locE = new OpenSeadragon.Rect(overlay_loc.x+overlay_loc.width, 0, this.viewer.viewport._contentBounds.width-(overlay_loc.x+overlay_loc.width), overlay_loc.y+overlay_loc.height)
        let locS = new OpenSeadragon.Rect(overlay_loc.x, overlay_loc.y+overlay_loc.height, this.viewer.viewport._contentBounds.width-overlay_loc.x, this.viewer.viewport._contentBounds.height-(overlay_loc.y+overlay_loc.height))
        let locW = new OpenSeadragon.Rect(0, overlay_loc.y, overlay_loc.x, this.viewer.viewport._contentBounds.height-overlay_loc.y)
        this.viewer.addOverlay({element: maskN[0], location: locN})
        this.viewer.addOverlay({element: maskE[0], location: locE})
        this.viewer.addOverlay({element: maskS[0], location: locS})
        this.viewer.addOverlay({element: maskW[0], location: locW})
    }

    hide_mask(){
        this.viewer.removeOverlay("mask_north")
        this.viewer.removeOverlay("mask_east")
        this.viewer.removeOverlay("mask_south")
        this.viewer.removeOverlay("mask_west")
    }

    setOSDDragHandler(element) {
        let tracker = new OpenSeadragon.MouseTracker({
            clickDistThreshold: 5,
            element: element,
            dragHandler: (event) => {
                this.isDragged = true
                let e = event.eventSource.element
                $(e).attr('data-noclick', true)
                let gestureSettings = null
                let canvasDragEventArgs = {
                    tracker: event.eventSource,
                    position: event.position,
                    delta: event.delta,
                    speed: event.speed,
                    direction: event.direction,
                    shift: event.shift,
                    originalEvent: event.originalEvent,
                    preventDefaultAction: event.preventDefaultAction
                }
                if (!canvasDragEventArgs.preventDefaultAction && this.viewer.viewport)
                    gestureSettings = this.viewer.gestureSettingsByDeviceType(event.pointerType)
                if (!this.viewer.panHorizontal)
                    event.delta.x = 0
                if (!this.viewer.panVertical)
                    event.delta.y = 0
                if (this.viewer.viewport.flipped)
                    event.delta.x = -event.delta.x
                if (this.viewer.constrainDuringPan) {
                    let delta = this.viewer.viewport.deltaPointsFromPixels(event.delta.negate())
                    this.viewer.viewport.centerSpringX.target.value += delta.x
                    this.viewer.viewport.centerSpringY.target.value += delta.y
                    let bounds = this.viewer.viewport.getBounds()
                    let constrainedBounds = this.viewer.viewport.getConstrainedBounds()
                    this.viewer.viewport.centerSpringX.target.value -= delta.x
                    this.viewer.viewport.centerSpringY.target.value -= delta.y
                    if (bounds.x != constrainedBounds.x)
                        event.delta.x = 0
                    if (bounds.y != constrainedBounds.y)
                        event.delta.y = 0
                }
                this.viewer.viewport.panBy(this.viewer.viewport.deltaPointsFromPixels(event.delta.negate()), gestureSettings.flickEnabled && !this.viewer.constrainDuringPan)
            }
        })
    }
}