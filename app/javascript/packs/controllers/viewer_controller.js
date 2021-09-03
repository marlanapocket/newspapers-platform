import { Controller } from "stimulus"

export default class extends Controller {
    static targets = ['currentPage', 'articleOverlay', 'selectedArticlePanel']
    static values = {currentPage: Number, nbpages: Number, pages: Array, articles: Array, selectedArticles: Array}

    isDragged = false
    viewer = null

    connect() {
        self = this
        self.viewer = OpenSeadragon({
            id: "openseadragon_view",
            prefixUrl: "/openseadragon/images/",
            sequenceMode: true,
            initialPage: 0,
            tileSources: self.pagesValue,
        });
        // Set the page counter on the osd viewer
        self.currentPageValue = self.viewer.currentPage()+1;
        self.currentPageTarget.innerHTML = self.currentPageValue;

        // Handler when the current page is changed
        self.viewer.addHandler("page", function(data) {
            self.currentPageValue = data.page + 1;
            self.currentPageTarget.innerHTML = self.currentPageValue;
        });

        // Handler when a page is open (when landing on page and after a page change)
        self.viewer.addHandler("open", function(data) {
            self.updateSelectedArticlePanel()
            for (let article of self.articlesValue) {
                article = JSON.parse(article)
                let pagenum = article.canvases_parts[0];
                pagenum = parseInt(pagenum.substring(pagenum.lastIndexOf('_')+1, pagenum.lastIndexOf("#xywh")))
                if (pagenum === self.currentPageValue) {
                    let bbox = article.bbox
                    let loc = self.viewer.viewport.imageToViewportRectangle(bbox[0], bbox[1], bbox[2], bbox[3])
                    let elt = $(`<div id="${article.id}" class="article_overlay"></div>`)
                    elt.attr("data-viewer-target", "articleOverlay")
                    elt.attr("data-action", "click->viewer#article_clicked")
                    elt.attr("data-loc", JSON.stringify({'x': loc.x, 'y': loc.y, 'width': loc.width, 'height': loc.height}))
                    elt.attr("data-text", JSON.stringify(article.all_text))
                    self.viewer.addOverlay({element: elt[0], location: loc});
                    self.setOSDDragHandler(elt[0])
                }
            }
        });
    }

    article_clicked(event) {
        self = this
        if(self.isDragged) {
            self.isDragged = false
        }
        else {
            self.hide_mask()
            // If the article is already selected
            if(self.selectedArticlesValue.includes($(event.target).attr('id'))) {
                $(event.target).removeClass("article_overlay_selected")
                $(event.target).addClass("article_overlay")
                self.selectedArticlesValue = self.selectedArticlesValue.filter(item => item !== $(event.target).attr('id'))
            }
            else {  // If the article is not yet selected
                console.log($(event.target).attr('id'))
                $(".article_overlay_selected").removeClass("article_overlay_selected")
                $(".article_overlay_selected").addClass("article_overlay")
                $(event.target).addClass("article_overlay_selected")
                $(event.target).removeClass("article_overlay")
                // let selected_articles = self.selectedArticlesValue
                // selected_articles.push($(event.target).attr('id'))
                // self.selectedArticlesValue = selected_articles
                self.selectedArticlesValue = [$(event.target).attr('id')]
                self.display_mask($(event.target).data('loc'))
            }
            self.updateSelectedArticlePanel()
        }
    }

    updateSelectedArticlePanel() {
        console.log(self.selectedArticlesValue)
        self = this
        if(self.selectedArticlesValue.length == 0) {
            self.selectedArticlePanelTarget.hidden = true
        }
        else {
            self.selectedArticlePanelTarget.hidden = false
            const text = $.map(self.selectedArticlesValue, (article_id, idx) => {
                return $(`#${article_id}`).data('text').replaceAll("\"", "").replaceAll("\\n", "<br/>")
            }).join("\n")
            const title = self.selectedArticlesValue.length == 1 ? self.selectedArticlesValue[0] : "Compound"
            $(self.selectedArticlePanelTarget).find('h5')[0].innerHTML = title
            $(self.selectedArticlePanelTarget).find('p')[0].innerHTML = text
        }

    }

    display_mask(overlay_loc) {
        self = this
        let maskN = $("<div id=\"mask_north\" class=\"selection_mask\"></div>")
        let maskE = $("<div id=\"mask_east\" class=\"selection_mask\"></div>")
        let maskS = $("<div id=\"mask_south\" class=\"selection_mask\"></div>")
        let maskW = $("<div id=\"mask_west\" class=\"selection_mask\"></div>")
        let locN = new OpenSeadragon.Rect(0, 0, overlay_loc.x+overlay_loc.width, overlay_loc.y)
        let locE = new OpenSeadragon.Rect(overlay_loc.x+overlay_loc.width, 0, self.viewer.viewport._contentBounds.width-(overlay_loc.x+overlay_loc.width), overlay_loc.y+overlay_loc.height)
        let locS = new OpenSeadragon.Rect(overlay_loc.x, overlay_loc.y+overlay_loc.height, self.viewer.viewport._contentBounds.width-overlay_loc.x, self.viewer.viewport._contentBounds.height-(overlay_loc.y+overlay_loc.height))
        let locW = new OpenSeadragon.Rect(0, overlay_loc.y, overlay_loc.x, self.viewer.viewport._contentBounds.height-overlay_loc.y)
        self.viewer.addOverlay({element: maskN[0], location: locN})
        self.viewer.addOverlay({element: maskE[0], location: locE})
        self.viewer.addOverlay({element: maskS[0], location: locS})
        self.viewer.addOverlay({element: maskW[0], location: locW})
    }

    hide_mask(){
        self = this
        self.viewer.removeOverlay("mask_north")
        self.viewer.removeOverlay("mask_east")
        self.viewer.removeOverlay("mask_south")
        self.viewer.removeOverlay("mask_west")
    }

    setOSDDragHandler(element) {
        self = this
        let tracker = new OpenSeadragon.MouseTracker({
            clickDistThreshold: 5,
            element: element,
            dragHandler: (event) => {
                self.isDragged = true
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
                if (!canvasDragEventArgs.preventDefaultAction && self.viewer.viewport)
                    gestureSettings = self.viewer.gestureSettingsByDeviceType(event.pointerType)
                if (!self.viewer.panHorizontal)
                    event.delta.x = 0
                if (!self.viewer.panVertical)
                    event.delta.y = 0
                if (self.viewer.viewport.flipped)
                    event.delta.x = -event.delta.x
                if (self.viewer.constrainDuringPan) {
                    let delta = self.viewer.viewport.deltaPointsFromPixels(event.delta.negate())
                    self.viewer.viewport.centerSpringX.target.value += delta.x
                    self.viewer.viewport.centerSpringY.target.value += delta.y
                    let bounds = self.viewer.viewport.getBounds()
                    let constrainedBounds = self.viewer.viewport.getConstrainedBounds()
                    self.viewer.viewport.centerSpringX.target.value -= delta.x
                    self.viewer.viewport.centerSpringY.target.value -= delta.y
                    if (bounds.x != constrainedBounds.x)
                        event.delta.x = 0
                    if (bounds.y != constrainedBounds.y)
                        event.delta.y = 0
                }
                self.viewer.viewport.panBy(self.viewer.viewport.deltaPointsFromPixels(event.delta.negate()), gestureSettings.flickEnabled && !self.viewer.constrainDuringPan)
            }
        })
    }
}