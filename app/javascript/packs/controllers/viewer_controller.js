import { Controller } from "stimulus"

export default class extends Controller {
    static targets = ['currentPage', 'articleOverlay']
    static values = {currentPage: Number, nbpages: Number, pages: Array, articles: Array}

    connect() {
        self = this
        self.viewer = OpenSeadragon({
            id: "openseadragon_view",
            prefixUrl: "/openseadragon/images/",
            sequenceMode: true,
            initialPage: 0,
            tileSources: self.pagesValue,
        });
        self.currentPageValue = self.viewer.currentPage()+1;
        self.currentPageTarget.innerHTML = self.currentPageValue;

        self.viewer.addHandler("page", function(data) {
            self.currentPageValue = data.page + 1;
            self.currentPageTarget.innerHTML = self.currentPageValue;
        });

        self.viewer.addHandler("open", function(data) {
            for (let article of self.articlesValue) {
                article = JSON.parse(article)
                let pagenum = article.canvases_parts[0];
                pagenum = parseInt(pagenum.substring(pagenum.lastIndexOf('_')+1, pagenum.lastIndexOf("#xywh")))
                if (pagenum === self.currentPageValue) {
                    let bbox = article.bbox
                    let loc = self.viewer.viewport.imageToViewportRectangle(bbox[0], bbox[1], bbox[2], bbox[3])
                    let elt = $(`<div id="${article.id}" class="article_overlay"></div>`)
                    elt.attr("data-viewer-target", "articleOverlay")
                    elt.attr("data-loc", JSON.stringify({'x': loc.x, 'y': loc.y, 'width': loc.width, 'height': loc.height}))
                    elt.attr("data-text", JSON.stringify(article.all_text))
                    self.viewer.addOverlay({element: elt[0], location: loc});
                    let tracker = new OpenSeadragon.MouseTracker({
                        clickDistThreshold: 30,
                        element: elt[0],
                        clickHandler: function(event) {
                            console.log(event.eventSource.element);
                        }
                    });
                }
            }
            console.log(self.articleOverlayTargets);
        });
    }
}