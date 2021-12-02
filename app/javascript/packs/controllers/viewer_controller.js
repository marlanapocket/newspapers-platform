import { Controller } from "stimulus"
import { SearchAPI } from "../utils/search_api"
import {DatasetAPI} from "../utils/dataset_api"
import Sortable from 'sortablejs'

export default class extends Controller {
    static targets = ['currentPage', 'articleOverlay', 'selectedArticlePanel', 'addArticleButton', 'addCompoundArticleButton', 'compoundArticlePanel']
    static values = {currentPage: Number, nbpages: Number, pages: Array, articles: Array, selectedArticles: Array, issueId: String, compoundMode: Boolean}

    isDragged = false
    viewer = null
    selectedCompound = null

    connect() {
        const selectedParam = (new URL(window.location.href)).searchParams.get('selected')
        const selectedCompoundParam = (new URL(window.location.href)).searchParams.get('selected_compound')
        if (selectedParam == null) {
            this.selectedArticlesValue = []
            if (selectedCompoundParam != null) {
                const compoundParts = $(`#compound-articles-panel li[data-compound-id="${selectedCompoundParam}"]`).data('parts')
                this.selectedCompound = {id: selectedCompoundParam, parts: compoundParts}
                $(`#compound-articles-panel li[data-compound-id="${selectedCompoundParam}"]`).addClass("active")
            }
        }
        else {
            this.selectedArticlesValue = [selectedParam]
        }
        this.setup_viewer()
        this.load_named_entities([this.issueIdValue])
        this.setup_mention_click()
        this.setup_compound()
        this.sortable = new Sortable(document.getElementById("compound_list"), {
            handle: ".li-handle",  // Drag handle selector within list items
            draggable: ".cmpnd-item"  // Specifies which items inside the element should be draggable
        })
    }

    setup_compound() {
        // Compound Mode Activation/Deactivation
        $("#compound_switch").prop('checked', false)
        $("#compound_switch").on("change", (event) => {
            this.compoundModeValue = !this.compoundModeValue
            if(this.compoundModeValue) { // if compound mode is being activated
                this.unselectArticles()
                this.unselect_compound_article()
                $("#compound_articles_list li").removeClass("active")
                $("#compound_card_content").removeClass("d-none")
            }
            else { // Compound deactivated
                $("#compound_list").html("")
                $("#compound_card_content").addClass("d-none")
                $('div.article_overlay_compound_selected').removeClass("article_overlay_compound_selected")
                this.selectedArticlesValue = []
            }
        })
        // Delete article part when creating a compound article
        $("#compound-articles-panel").on("click", ".delete_article_part", (event) => {
            const articleId = $(event.target).parents('li').data('id')
            $(`#${articleId}`).removeClass("article_overlay_compound_selected")
            this.selectedArticlesValue = this.selectedArticlesValue.filter(item => item !== articleId)
            $(`li[data-id="${articleId}"]`).remove()
            return false
        })
        // Open the modal to validate and create the compound article
        $("#create_compound_button").on("click", (event) => {
            const article_parts = new Map(this.selectedArticlesValue.map((artid) => {
                const text = this.articlesValue.filter(elt => {return elt.id == artid})[0].all_text
                return [artid, text]
            }))
            if(article_parts.length !== 0) {
                SearchAPI.confirm_compond_creation(Object.fromEntries(article_parts), (data) => {
                    $("#confirm_compound_modal").html(data.modal_content)
                    let myModal = new bootstrap.Modal(document.getElementById('confirm_compound_modal'), {})
                    myModal.toggle()
                })
            }
        })
        // On the modal, actual creation of the compound article
        $("#confirm_compound_modal").on("click", "#create-compound-button", (event) => {
            $("#compound_logs").html("")
            const title = $("#compound-title").val()
            const all_text = this.selectedArticlesValue.map((artid) => {return $(`#${artid}`).data('text') }).join("\n")
            event.target.setAttribute('disabled', 'disabled')
            event.target.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading`
            SearchAPI.create_compound(title, all_text, this.issueIdValue, this.selectedArticlesValue, (data) => {
                if(data.status === 'ok') {
                    bootstrap.Modal.getInstance(document.getElementById('confirm_compound_modal')).hide()
                    $("#compound_articles_list").html(data.html)
                    $("#compound_switch").prop("checked", false).change()
                }
                else {
                    $("#compound_logs").html(data['message'])
                    event.target.innerHTML = "Create"
                    event.target.removeAttribute('disabled')
                }
            })
        })
        // Delete a previously created compound article
        $("#compound_articles_list").on("click", ".delete_compound_article", (event) => {
            const parent_li = $(event.target).parents('li')
            const compoundId = parent_li.data('compound-id')
            if (confirm(`Are you sure you want to delete this compound article ? It will also be deleted from the datasets it belongs to.`)) {
                this.unselect_compound_article(compoundId)
                SearchAPI.delete_compound_article(compoundId, (data) => {
                    $("#compound_articles_list").html(data.html)
                    $("#manage_datasets_content").html(data.datasets)
                })
            }
            return false
        })
        // Compound article selection
        $("#compound_articles_list").on("click", "li", (event) => {
            const elt = $(event.target)
            if(elt.hasClass("active"))
                this.unselect_compound_article(elt.data('compoundId'))
            else
                this.select_compound_article(elt.data('compoundId'))
            return false
        })
    }

    select_compound_article(compoundId) {
        const compoundParts = $(`#compound-articles-panel li[data-compound-id="${compoundId}"]`).data('parts')
        this.selectedCompound = {id: compoundId, parts: compoundParts}
        $("#compound-articles-panel li").removeClass("active")
        $(`#compound-articles-panel li[data-compound-id="${compoundId}"]`).addClass("active")
        this.unselectArticles()
        $(this.addArticleButtonTarget).addClass("d-none")
        $(this.addCompoundArticleButtonTarget).removeClass("d-none")
        $(".article_overlay_compound_selected").removeClass("article_overlay_compound_selected").addClass("article_overlay")
        for(const part_id of this.selectedCompound.parts) {
            $(`#${part_id}`).addClass("article_overlay_compound_selected")
        }
        if (window.history.replaceState) {
            let url = new URL(window.location.href)
            url.searchParams.set('selected_compound', this.selectedCompound.id)
            window.history.replaceState(null, '', url.toString())
        }
        this.load_named_entities(this.selectedCompound.parts)
        this.updateSelectedArticlePanel()
    }

    unselect_compound_article(compoundId) {
        $(this.addCompoundArticleButtonTarget).addClass("d-none")
        this.selectedCompound = null
        if (compoundId == undefined)
            $(`#compound-articles-panel li`).removeClass("active")
        else
            $(`#compound-articles-panel li[data-compound-id="${compoundId}"]`).removeClass("active")
        $(".article_overlay_compound_selected").removeClass("article_overlay_compound_selected").addClass("article_overlay")
        if (window.history.replaceState) {
            let url = new URL(window.location.href)
            url.searchParams.delete('selected_compound')
            window.history.replaceState(null, '', url.toString())
        }
        this.load_named_entities([this.issueIdValue])
        this.updateSelectedArticlePanel()
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
            const articleId = event.target.getAttribute('id')
            // If the article is already selected
            if(this.selectedArticlesValue.includes(articleId)) {
                if(this.compoundModeValue) {
                    $(event.target).removeClass("article_overlay_compound_selected")
                    this.selectedArticlesValue = this.selectedArticlesValue.filter(item => item !== articleId)
                    $(`li[data-id="${articleId}"]`).remove()
                }
                else {
                    this.unselectArticles(articleId)
                }
            }
            else {  // If the article is not yet selected
                if(this.compoundModeValue) {
                    $(event.target).addClass("article_overlay_compound_selected")
                    const arr = this.selectedArticlesValue
                    arr.push(articleId)
                    this.selectedArticlesValue = arr
                    const list_elt = $(`<li data-id="${articleId}" class="list-group-item cmpnd-item"></li>`)
                    const text = $(`<div class="text_part" style="display: inline;">${$(event.target).data("text").slice(1,-1).substring(0,37)}...</div>`)
                    const delete_span = $(`<a class="delete_article_part text-danger float-end" href="#"><span class="fas fa-times"></span></a>`)
                    const move_span = $(`<i class="fas fa-grip-vertical li-handle" style="color: black"></i>`)
                    list_elt.append(move_span)
                    list_elt.append(text)
                    list_elt.append(delete_span)
                    $("#compound_list").append(list_elt)
                }
                else {
                    this.hide_mask()
                    $(this.addArticleButtonTarget).removeClass("d-none")
                    this.selectedCompound = null
                    $(this.addCompoundArticleButtonTarget).addClass("d-none")
                    $("#compound_articles_list li").removeClass("active")
                    $(".article_overlay_compound_selected").removeClass("article_overlay_compound_selected").addClass("article_overlay")
                    $(".article_overlay_selected").removeClass("article_overlay_selected").addClass("article_overlay")
                    $(event.target).addClass("article_overlay_selected").removeClass("article_overlay")
                    this.selectedArticlesValue = [articleId]
                    this.display_mask($(event.target).data('loc'))
                    // Change url param for selected article
                    if (window.history.replaceState) {
                        let url = new URL(window.location.href)
                        url.searchParams.delete('selected_compound')
                        url.searchParams.set('selected', articleId)
                        window.history.replaceState(null, '', url.toString())
                    }
                    $('#named-entities-panel').find(".card-body").html("<div class='spinner-border'></div>")
                    this.load_named_entities([articleId])
                    this.updateSelectedArticlePanel()
                }
            }
        }
    }

    unselectArticles(articleId) {
        this.hide_mask()
        $(this.addArticleButtonTarget).addClass("d-none")
        $(".article_overlay_selected").removeClass("article_overlay_selected").addClass("article_overlay")
        if (articleId === undefined) {
            if (this.selectedArticlesValue.length !== 0) {
                $('#named-entities-panel').find(".card-body").html("<div class='spinner-border'></div>")
                this.load_named_entities([this.issueIdValue])
            }
            this.selectedArticlesValue = []
        }
        else {
            this.selectedArticlesValue = this.selectedArticlesValue.filter(item => item !== articleId)
            $('#named-entities-panel').find(".card-body").html("<div class='spinner-border'></div>")
            this.load_named_entities([this.issueIdValue])
        }

        // Change url param for selected article
        if (window.history.replaceState) {
            let url = new URL(window.location.href)
            url.searchParams.delete('selected')
            window.history.replaceState(null, '', url.toString())
        }
        this.updateSelectedArticlePanel()
    }

    updateSelectedArticlePanel() {
        if(this.selectedArticlesValue.length == 0) {
            if(this.selectedCompound) {
                this.selectedArticlePanelTarget.hidden = false
                const text = $.map(this.selectedCompound.parts, (article_id, idx) => {
                    const art = this.articlesValue.filter(elt => elt.id == article_id)[0]
                    return art.all_text.replaceAll("\"", "").replaceAll("\\n", "<br/>")
                }).join("\n")
                $(this.selectedArticlePanelTarget).find('h5')[0].innerHTML = ""
                $(this.selectedArticlePanelTarget).find('p')[0].innerHTML = text
            }
            else {
                this.selectedArticlePanelTarget.hidden = true
            }
        }
        else {
            this.selectedArticlePanelTarget.hidden = false
            const text = $.map(this.selectedArticlesValue, (article_id, idx) => {
                return $(`#${article_id}`).data('text').replaceAll("\"", "").replaceAll("\\n", "<br/>")
            }).join("\n")
            let title
            if(this.selectedArticlesValue.length == 1) {
                title = this.articlesValue.filter(o => o.id === this.selectedArticlesValue[0])[0].title
                if(title == null)
                    title = this.selectedArticlesValue[0]
            }
            else
                title = "Compound"
            $(this.selectedArticlePanelTarget).find('h5')[0].innerHTML = title
            $(this.selectedArticlePanelTarget).find('p')[0].innerHTML = text
        }

    }

    load_named_entities(docsIds) {
        SearchAPI.load_named_entities(docsIds, (data) => {
            $('#named-entities-panel').find(".card-body").html(data)
        })
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
            option.html(`${data['title']} (${data['nbissues']+data['nbarticles']} docs)`)
        })
    }

    addSelectedCompoundArticleToWorkingDataset(event) {
        DatasetAPI.addSelectedCompoundToWorkingDataset(this.selectedCompound.id, (data) => {
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
            option.html(`${data['title']} (${data['nbissues']+data['nbarticles']+data['nbcompounds']} docs)`)
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
            option.html(`${data['title']} (${data['nbissues']+data['nbarticles']} docs)`)
        })
    }

    setup_viewer() {
        const selectedArticleObject = this.articlesValue.filter((elt)=>{return elt.id == this.selectedArticlesValue[0]})[0]
        let initialPage = null
        if(selectedArticleObject == undefined) {
            if(this.selectedCompound) {
                $(this.addCompoundArticleButtonTarget).removeClass("d-none")
                $(this.addArticleButtonTarget).addClass("d-none")
                const first_article_part = this.articlesValue.filter((elt)=>{return elt.id == this.selectedCompound.parts[0]})[0]
                const pagenum = first_article_part.canvases_parts[0]
                initialPage = parseInt(pagenum.substring(pagenum.lastIndexOf('_')+1, pagenum.lastIndexOf("#xywh")))-1
            }
            else {
                initialPage = 0
                $(this.addArticleButtonTarget).addClass("d-none")
                $(this.addCompoundArticleButtonTarget).addClass("d-none")
            }
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
            if(!this.compoundModeValue) {
                $('#named-entities-panel').find(".card-body").html("<div class='spinner-border'></div>")
                this.load_named_entities([this.issueIdValue])
                this.selectedArticlesValue = []
                if (window.history.replaceState) {
                    let url = new URL(window.location.href)
                    url.searchParams.delete('selected')
                    window.history.replaceState(null, '', url.toString())
                }
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
                    if(this.compoundModeValue) {
                        if(this.selectedArticlesValue.includes(article.id)) {
                            article_class = "article_overlay_compound_selected"
                        }
                        else {
                            article_class = "article_overlay"
                        }
                    }
                    else {
                        if(this.selectedArticlesValue[0] == article.id) {
                            this.display_mask(loc)
                            article_class = "article_overlay_selected"
                        }
                        else {
                            if(this.selectedCompound !== null && this.selectedCompound.parts.includes(article.id)) {
                                article_class = "article_overlay_compound_selected"
                            }
                            else {
                                article_class = "article_overlay"
                            }
                        }
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