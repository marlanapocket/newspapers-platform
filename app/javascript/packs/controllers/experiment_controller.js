import { Controller } from "stimulus"
import { Draggable } from "@shopify/draggable"
import Panzoom from '@panzoom/panzoom'
import {ExperimentAPI} from "../utils/experiment_api"

export default class extends Controller {
    static targets = []
    static values = {experimentId: Number}

    connect() {
        this.currentPan = {x: 0, y: 0}
        this.currentScale = 1
        this.initPanzoom()
        this.initDraggable()
        new bootstrap.Offcanvas($("#params_offcanvas")[0])

        const observer = new MutationObserver((mutations) => {
            this.refresh_display()
        })
        observer.observe(document.getElementById("experiment_area"), {attributes: true})
    }

    run_experiment(event) {
        $("#experiment_loader").addClass("spinner-border")
        $("#run_experiment_button").attr("disabled", true)
        $("#run_experiment_button span").html("Running...")
        ExperimentAPI.run_experiment(this.experimentIdValue, (data) => {
            $("#experiment_area").html(data['html_tree'])
            if (!data['experiment_running']) {
                $("#experiment_loader").removeClass("spinner-border")
                $("#run_experiment_button").attr("disabled", false)
                $("#run_experiment_button span").html("Run experiment")
            }
            this.refresh_display()
        })
    }

    run_tool(event) {
        const toolId = $(event.target).closest(".tool-slot-occupied").attr('id').substring(5)
        ExperimentAPI.runTool(toolId, this.experimentIdValue, (data) => {})
    }

    display_results(event) {
        const toolId = $(event.target).closest(".tool-slot-occupied").attr('id').substring(5)
        const offcanvasElement = $("#params_offcanvas")[0]
        offcanvasElement.innerHTML = "<div class='d-flex justify-content-center'><div class='mt-5 spinner-border'></div></div>"
        offcanvasElement.setAttribute("data-tool-slot-id", toolId)
        offcanvasElement.setAttribute("style", "width: 75vw;")
        bootstrap.Offcanvas.getInstance(offcanvasElement).show()
        ExperimentAPI.openToolResults(toolId, this.experimentIdValue, (data) => {
            offcanvasElement.innerHTML = data
        })
    }

    display_tool_config(event) {
        const toolId = $(event.target).closest(".tool-slot-occupied").attr('id').substring(5)
        ExperimentAPI.openToolConfig(toolId, this.experimentIdValue, (data) => {
            const offcanvasElement = $("#params_offcanvas")[0]
            offcanvasElement.innerHTML = data
            offcanvasElement.setAttribute("data-tool-slot-id", toolId)
            offcanvasElement.setAttribute("style", "width: 400px;")
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
                this.refresh_display()
            })
        }
    }

    delete_tool(event) {
        const toolId = $(event.target).closest('.tool-slot-occupied').attr('id').substring(5)
        ExperimentAPI.deleteTool(toolId, this.experimentIdValue, (data) => {
            this.refresh_display()
        })
    }

    refresh_display() {
        this.currentPan = this.panzoom.getPan()
        this.currentScale = this.panzoom.getScale()
        this.panzoom.destroy()
        this.draggable.destroy()
        this.initPanzoom()
        this.initDraggable()
    }

    initPanzoom() {
        const canvas_elem = document.getElementById("experiment_canvas")
        this.panzoom = Panzoom(canvas_elem, {
            cursor: "auto",
            startScale: this.currentScale,
            startX: this.currentPan.x,
            startY: this.currentPan.y
        })
        canvas_elem.addEventListener('wheel', this.panzoom.zoomWithWheel)
    }

    initDraggable() {
        this.draggable = new Draggable(document.querySelectorAll('.dnd-zone'), {
            draggable: '.tool',
            mirror: { constrainDimensions: true, appendTo: 'body'}
        })
        let mirror2
        let final_dropzone
        let toolsMenu = document.querySelector("#tools_menu")
        this.draggable.on('mirror:created', (event) => {
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
        this.draggable.on('drag:over:container', (event) => {
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

        this.draggable.on('drag:out:container', (event) => {
            if(event.overContainer === toolsMenu){
                return;
            }
            final_dropzone = null
            event.overContainer.innerHTML = ''
            $('html,body').css('cursor','grabbing')
        })
        this.draggable.on('drag:stop', (event) => {
            $('html,body').css('cursor','auto')
            if(final_dropzone != null) {
                if($(final_dropzone).hasClass("possible-tool-slot")) {
                    const tool = $(event.originalSource).data('tool')
                    const parent = final_dropzone.parentElement.parentElement.previousElementSibling
                    const parentId = (parent == null) ? null : parent.getAttribute('id').substring(5)
                    ExperimentAPI.addTool(JSON.stringify(tool), parentId, this.experimentIdValue, (data) => {
                        final_dropzone = null
                        this.refresh_display()
                    })
                }
                else {
                    $(final_dropzone).html("")
                }
            }
            $(".tool-slot").removeClass("possible-tool-slot")
        })
    }
}