import { Controller } from "stimulus"
import { SearchAPI } from "../utils/search_api"

export default class extends Controller {
    static targets = ['currentPage', 'articleOverlay', 'selectedArticlePanel']
    static values = {currentPage: Number, nbpages: Number, pages: Array, articles: Array, selectedArticles: Array}

    isDragged = false
    viewer = null

    connect() {
        this.setup_viewer()
        this.load_named_entities()
    }

    article_clicked(event) {
        if(this.isDragged) {
            this.isDragged = false
        }
        else {
            this.hide_mask()
            // If the article is already selected
            if(this.selectedArticlesValue.includes($(event.target).attr('id'))) {
                $(event.target).removeClass("article_overlay_selected")
                $(event.target).addClass("article_overlay")
                this.selectedArticlesValue = this.selectedArticlesValue.filter(item => item !== $(event.target).attr('id'))
            }
            else {  // If the article is not yet selected
                $(".article_overlay_selected").removeClass("article_overlay_selected").addClass("article_overlay")
                $(event.target).addClass("article_overlay_selected")
                $(event.target).removeClass("article_overlay")
                this.selectedArticlesValue = [$(event.target).attr('id')]
                this.display_mask($(event.target).data('loc'))
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

    load_named_entities() {
        SearchAPI.load_named_entities(window.location.pathname.split('/').pop(), (data) => {
            $('#named-entities-panel').find(".card-body").html(data)
        })
    }

    setup_viewer() {
        this.viewer = OpenSeadragon({
            id: "openseadragon_view",
            prefixUrl: "/openseadragon/images/",
            sequenceMode: true,
            initialPage: 0,
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
        })

        // Handler when a page is open (when landing on page and after a page change)
        this.viewer.addHandler("open", (data) => {
            this.updateSelectedArticlePanel()
            for (let article of this.articlesValue) {
                article = JSON.parse(article)
                let pagenum = article.canvases_parts[0]
                pagenum = parseInt(pagenum.substring(pagenum.lastIndexOf('_')+1, pagenum.lastIndexOf("#xywh")))
                if (pagenum === this.currentPageValue) {
                    let bbox = article.bbox
                    let loc = this.viewer.viewport.imageToViewportRectangle(bbox[0], bbox[1], bbox[2], bbox[3])
                    let elt = $(`<div id="${article.id}" class="article_overlay"></div>`)
                    elt.attr("data-viewer-target", "articleOverlay")
                    elt.attr("data-action", "click->viewer#article_clicked")
                    elt.attr("data-loc", JSON.stringify({'x': loc.x, 'y': loc.y, 'width': loc.width, 'height': loc.height}))
                    elt.attr("data-text", JSON.stringify(article.all_text))
                    this.viewer.addOverlay({element: elt[0], location: loc})
                    this.setOSDDragHandler(elt[0])
                }
            }
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