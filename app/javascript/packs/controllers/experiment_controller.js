import { Controller } from "stimulus"
import { Draggable } from "@shopify/draggable"
import { Templates } from "../utils/templates"
import { ServerAPI } from "../utils/server_api"

export default class extends Controller {
    static targets = []
    static values = {experimentId: Number}

    connect() {
        this.panzoom = this.initPanzoom()
        this.draggable = this.initDraggable()
        new bootstrap.Offcanvas($("#params_offcanvas")[0])
    }

    display_tool_config(event) {
        const toolId = $(event.target).closest(".tool-slot-occupied").attr('id').substring(5)
        ServerAPI.openToolConfig(toolId, this.experimentIdValue, (data) => {
            const offcanvasElement = $("#params_offcanvas")[0]
            offcanvasElement.innerHTML = data
            offcanvasElement.setAttribute("data-tool-slot-id", toolId)
            bootstrap.Offcanvas.getInstance(offcanvasElement).show()
        })
    }

    apply_tool_config(event) {
        // TODO: Check if all config fields are valid
        const offcanvasElement = $("#params_offcanvas")
        const toolId = offcanvasElement.attr("data-tool-slot-id")
        const parameters = {}
        $("#params_offcanvas").find(".tool-param").find("input,select").map( (i, e) => {
            parameters[e.getAttribute("data-param")] = $(e).val()
        })
        ServerAPI.editTool(toolId, parameters, this.experimentIdValue, () => {
            bootstrap.Offcanvas.getInstance(offcanvasElement[0]).hide()
        })
    }

    delete_tool(event) {
        const toolId = $(event.target).closest('.tool-slot-occupied').attr('id').substring(5)
        ServerAPI.deleteTool(toolId, this.experimentIdValue, (data) => {
            this.panzoom.destroy()
            this.panzoom = this.initPanzoom()
            this.draggable.destroy()
            this.draggable = this.initDraggable()
        })
    }

    initPanzoom() {
        const canvas_elem = $("#experiment_canvas")[0]
        const panzoom = Panzoom.default(canvas_elem, {
            cursor: "auto"
        })
        canvas_elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)
        // panzoom.pan(10, 10)
        // panzoom.zoom(2, { animate: true })
        return panzoom
    }

    initDraggable() {
        let draggable = new Draggable(document.querySelectorAll('.dnd-zone'), {
            draggable: '.tool',
            mirror: { constrainDimensions: true, appendTo: 'body'}
        })
        let mirror2
        let final_dropzone
        let toolsMenu = document.querySelector("#tools_menu")
        draggable.on('mirror:created', (event) => {
            $('html,body').css('cursor','grabbing')
            let isSource = $(event.originalSource).parent().parent().attr('id') == "nav-source"
            mirror2 = event.mirror.cloneNode(true)
            for(const toolslot of $(".tool-slot")) {
                if($(toolslot).parentsUntil(".tree", "ul").length == 0 && isSource) {
                    $(toolslot).addClass("possible-tool-slot")
                }
                if($(toolslot).parentsUntil(".tree", "ul").length != 0 && !isSource) {
                    $(toolslot).addClass("possible-tool-slot")
                }
            }
        })
        draggable.on('drag:over:container', (event) => {
            if(event.overContainer === toolsMenu){
                return
            }
            final_dropzone = event.overContainer
            if($(final_dropzone).hasClass("possible-tool-slot")) {
                event.overContainer.appendChild(mirror2)
            }
            else {
                $('html,body').css('cursor','not-allowed')
            }
        })

        draggable.on('drag:out:container', (event) => {
            if(event.overContainer === toolsMenu){
                return;
            }
            final_dropzone = null
            event.overContainer.innerHTML = ''
            $('html,body').css('cursor','grabbing')
        })
        draggable.on('drag:stop', (event) => {
            $('html,body').css('cursor','auto')
            if(final_dropzone != null) {
                if($(final_dropzone).hasClass("possible-tool-slot")) {
                    const tool = $(event.originalSource).data('tool')
                    const parent = final_dropzone.parentElement.parentElement.previousElementSibling
                    const parentId = (parent == null) ? null : parent.getAttribute('id').substring(5)
                    ServerAPI.addTool(JSON.stringify(tool), parentId, this.experimentIdValue, (data) => {
                        final_dropzone = null
                        this.panzoom.destroy()
                        this.panzoom = this.initPanzoom()
                        this.draggable.destroy()
                        this.draggable = this.initDraggable()
                    })
                }
                else {
                    $(final_dropzone).html("")
                }
            }
            $(".tool-slot").removeClass("possible-tool-slot")
        })
        return draggable
    }
}