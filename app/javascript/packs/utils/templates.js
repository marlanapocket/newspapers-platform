import {ServerAPI} from "./server_api";
export class Templates {

    static canvasTool(tool) {
        return  `
            <div id="tool_${tool.toolId}" 
                 class="p-0 tf-nc tool-slot-occupied border border-2 border-secondary" 
                 data-status="created">
                <div class="h-100 w-100 card text-center">
                    <div class="card-header px-1 d-flex align-items-center justify-content-between">
                        <span>${ tool.name }</span>
                        <button type="button" class="btn btn-danger px-2 my-1" data-action="click->experiment#delete_tool">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="card-body h-100">
                        <div class="h-100 d-flex justify-content-around align-items-center">
                            <button type="button" class="btn btn-secondary px-2 d-flex align-items-center justify-content-between" data-action="click->experiment#display_tool_config">
                                <i class="fas fa-cog me-2"></i>Configure
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    static toolParamsOffcanvas(data) {
        return `
            <div class="offcanvas-header">
                <h5 class="offcanvas-title">${data.name}</h5>
                <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
                ${Templates.toolParams(data.parameters)}
                <button type="button" class="btn btn-success" data-action="click->experiment#apply_tool_config">Apply</button>
            </div>
        `
    }

    static toolParams(params) {
        const params_fields = []
        for(const param of params) {
            console.log(param)
            let label = `<span title="${param.description}" class="input-group-text">${param.name}</span>`
            let input = null
            switch(param['type']) {
                case "string":
                    input = `<input class="form-control" type="text" placeholder="${param.default}" data-param="${param.name}" value="${param.value ? param.value : param.default}"/>`
                    break
                case 'float':
                    input = `<input class="form-control" type="number" min="0" max="1" step="0.01" value="${param.value ? param.value : param.default}" data-param="${param.name}"/>`
                    break
                case 'integer':
                    input = `<input class="form-control" type="number" min="1" max="999" value="${param.value ? param.value : param.default}" data-param="${param.name}"/>`
                    break
                case 'select':
                    const options = []
                    if(param.values.length == 0) { // If source tool, values array is empty
                        options.push(`<option ${param.value ? "" : "selected"} disabled>Select a source dataset</option>`)
                        for(const dataset of $("#experiment-container").data('user-datasets')) {
                            options.push(`<option ${param.value != dataset.id ? "" : "selected"} value="${dataset.id}">${dataset.title}</option>`)
                        }
                    }
                    else {
                        options.push(`<option selected disabled>Select a value</option>`)
                        for (const val of param.values) {
                            options.push(`<option value="${val}">${val}</option>`)
                        }
                    }
                    input = `<select class="form-select" data-param="${param.name}">${options.join("")}</select>`
                    break
            }
            params_fields.push(`<div class="tool-param input-group">${label}${input}</div>`)
        }
        return params_fields.join("")
    }
}

