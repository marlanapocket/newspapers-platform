import { Controller } from "stimulus"

export default class extends Controller {
    static targets = ['currentPage']
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
            console.log(self.currentPageValue);
        });
    }
}