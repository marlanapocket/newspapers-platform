import { Controller } from "stimulus"
import { Draggable } from "@shopify/draggable"
import {ExperimentAPI} from "../utils/experiment_api"

export default class extends Controller {
    static targets = []
    static values = {experimentId: Number}

    connect() {
        this.panzoom = this.initPanzoom()
        this.draggable = this.initDraggable()
        new bootstrap.Offcanvas($("#params_offcanvas")[0])

        const observer = new MutationObserver((mutations) => {
            this.refresh_display()
        })
        observer.observe(document.getElementById("experiment_area"), {attributes: true})
    }

    run_experiment(event) {

    }

    run_tool(event) {
        const toolId = $(event.target).closest(".tool-slot-occupied").attr('id').substring(5)
        ExperimentAPI.runTool(toolId, this.experimentIdValue, (data) => {})
    }

    display_tool_config(event) {
        const toolId = $(event.target).closest(".tool-slot-occupied").attr('id').substring(5)
        ExperimentAPI.openToolConfig(toolId, this.experimentIdValue, (data) => {
            const offcanvasElement = $("#params_offcanvas")[0]
            offcanvasElement.innerHTML = data
            offcanvasElement.setAttribute("data-tool-slot-id", toolId)
            bootstrap.Offcanvas.getInstance(offcanvasElement).show()
        })
    }

    apply_tool_config(event) {
        const offcanvasElement = $("#params_offcanvas")
        const toolId = offcanvasElement.attr("data-tool-slot-id")
        const DOMParameters = $("#params_offcanvas").find(".tool-param").find("input,select")
        if(DOMParameters.toArray().some( (elt) => { return !$(elt).val() } )) {
            offcanvasElement.find("#params_message").html("Make sure to select valid parameters.")
        }
        else {
            const parameters = {}
            DOMParameters.map( (i, e) => {
                parameters[e.getAttribute("data-param")] = $(e).val()
            })
            ExperimentAPI.editTool(toolId, parameters, this.experimentIdValue, () => {
                this.panzoom.destroy()
                this.panzoom = this.initPanzoom()
                this.draggable.destroy()
                this.draggable = this.initDraggable()})
        }
    }

    delete_tool(event) {
        const toolId = $(event.target).closest('.tool-slot-occupied').attr('id').substring(5)
        ExperimentAPI.deleteTool(toolId, this.experimentIdValue, (data) => {
            this.panzoom.destroy()
            this.panzoom = this.initPanzoom()
            this.draggable.destroy()
            this.draggable = this.initDraggable()
        })
    }

    refresh_display() {
        this.panzoom.destroy()
        this.draggable.destroy()
        this.panzoom = this.initPanzoom()
        this.draggable = this.initDraggable()
    }

    initPanzoom() {
        const canvas_elem = $("#experiment_canvas")[0]
        const panzoom = Panzoom.default(canvas_elem, {
            cursor: "auto"
        })
        canvas_elem.parentElement.removeEventListener('wheel', panzoom.zoomWithWheel)
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
            const draggedInputType = $(event.originalSource).data('tool')['input_type']
            mirror2 = event.mirror.cloneNode(true)
            for(const toolslot of $(".tool-slot")) {
                let toolSlotParentOutputType = $(toolslot.parentElement.parentElement.parentElement.firstChild).data('output-type')
                toolSlotParentOutputType = (toolSlotParentOutputType == undefined) ? "" : toolSlotParentOutputType
                if(toolSlotParentOutputType == draggedInputType) {
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
                    ExperimentAPI.addTool(JSON.stringify(tool), parentId, this.experimentIdValue, (data) => {
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