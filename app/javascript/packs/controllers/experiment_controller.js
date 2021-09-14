import { Controller } from "stimulus"
import { Draggable } from "@shopify/draggable"
import { Templates } from "../utils/templates"
import { ServerAPI } from "../utils/server_api"

export default class extends Controller {
    static targets = []
    static values = {lastId: Number, experimentId: Number}

    connect() {
        this.initPanzoom()
        this.draggable = this.initDraggable()
        new bootstrap.Offcanvas($("#params_offcanvas")[0])
        this.loadExperiment()
    }

    display_tool_config(event) {
        let toolSlot = $(event.target).parents(".tool-slot-occupied")
        let offcanvasElement = $("#params_offcanvas")[0]
        offcanvasElement.innerHTML = Templates.toolParamsOffcanvas(toolSlot.data("tool-params"))
        offcanvasElement.setAttribute("data-tool-slot-id", toolSlot.attr('id'))

        let offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement)
        offcanvas.show()
    }

    apply_tool_config(event) {
        // TODO: Check if all config fields are valid
        let offcanvasElement = $("#params_offcanvas")
        let toolSlot = $(`#${offcanvasElement.attr("data-tool-slot-id")}`)

        const tool_params = toolSlot.data("tool-params")
        for(let param of offcanvasElement.find(".tool-param").find("input,select")) {
            param = $(param)
            const current_param = param.data('param')
            tool_params.parameters.filter( (p) => p.name == current_param )[0].value = param.val()
        }
        toolSlot.data("tool-params", tool_params)

        let current_status = toolSlot.data("status")
        toolSlot.data("status","configured")
        toolSlot.find("span.tool-status").removeClass(`tool-status-${current_status}`)
        toolSlot.find("span.tool-status").addClass(`tool-status-configured`)
        this.saveExperiment()

        let offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement[0])
        offcanvas.hide()
    }

    delete_tool(event) {
        $(event.currentTarget).parents(".tool-slot-occupied").parent().remove()
        this.saveExperiment()
    }

    initPanzoom() {
        const canvas_elem = $("#experiment_canvas")[0]
        const panzoom = Panzoom.default(canvas_elem, {
            cursor: "auto"
        })
        canvas_elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)
        // panzoom.pan(10, 10)
        // panzoom.zoom(2, { animate: true })
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
                    this.lastIdValue++
                    const defaultsParams = $(event.originalSource).data('tool')
                    defaultsParams['toolId'] = this.lastIdValue
                    final_dropzone.outerHTML = Templates.canvasTool(defaultsParams)
                    const tool = $(`#tool_${this.lastIdValue}`)
                    tool.data("tool-params", defaultsParams)
                    const toolSlot1 = $("<li><div class=\"tf-nc tool-slot dnd-zone\"></div></li>")[0]
                    const toolSlot2 = $("<ul><li><div class=\"tf-nc tool-slot dnd-zone\"></div></li></ul>")[0]
                    tool[0].parentElement.parentElement.appendChild(toolSlot1)
                    tool[0].parentElement.appendChild(toolSlot2)
                    final_dropzone = null
                    draggable.destroy()
                    this.draggable.destroy()
                    this.draggable = this.initDraggable()
                    this.saveExperiment()
                }
                else {
                    $(final_dropzone).html("")
                }
            }
            $(".tool-slot").removeClass("possible-tool-slot")
        })
        return draggable
    }

    saveExperiment() {
        function buildJSON(li) {
            let subObj = {}
            subObj.tool = li.children().data('tool-params')
            li.children('ul').children().each(function() {
                const currentLi = $(this)
                if (!subObj.children) {
                    subObj.children = []
                }
                if(!currentLi.children().hasClass("tool-slot"))
                    subObj.children.push(buildJSON(currentLi))
            })
            return subObj
        }
        const graph = {children: []}
        $('ul.tree > li').each(function() {
            const currentLi = $(this)
            if(!currentLi.children().hasClass("tool-slot"))
                graph.children.push(buildJSON(currentLi))
        })
        ServerAPI.saveExperiment(this.experimentIdValue, JSON.stringify(graph), ()=>{})
    }

    loadExperiment() {
        function buildList(data, self) {
            if(data.tool.toolId > self.lastIdValue) {
                self.lastIdValue = data.tool.toolId
            }
            const li = $("<li></li>")
            const toolElt = $(Templates.canvasTool(data.tool))
            toolElt.data("tool-params", data.tool)
            li.append(toolElt)
            const ul = $("<ul></ul>")
            if(data.children && data.children.length > 0) {
                for(const child of data.children) {
                    ul.append(buildList(child, self))
                }
            }
            ul.append($("<li><div class=\"tf-nc tool-slot dnd-zone\"></div></li>"))
            li.append(ul)
            return li
        }

        ServerAPI.loadExperiment(this.experimentIdValue, (data) => {
            const tree = $("<ul></ul>")
            if(data.children && data.children.length > 0) {
                for(const source_tool of data.children) {
                    tree.append(buildList(source_tool, this))
                }
            }
            tree.append($("<li><div class=\"tf-nc tool-slot dnd-zone\"></div></li>"))
            $("#experiment_canvas ul.tree").empty()
            $("#experiment_canvas ul.tree").append(tree.children())
            this.draggable.destroy()
            this.draggable = this.initDraggable()
        })
    }
}