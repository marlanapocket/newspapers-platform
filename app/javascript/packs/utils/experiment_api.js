export class ExperimentAPI {

    static create_experiment(title, callback) {
        $.ajax({
            type: "POST",
            url: "/experiment/create",
            data: {title: title},
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            },
            error: (jqXHR, textStatus, errorThrown) => {

            }
        })
    }

    static update_experiments_list(callback) {
        $.ajax({
            type: "GET",
            url: "/experiments/update",
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            dataType: "script",
            success: (data, textStatus, jqXHR) => {
                callback(data)
            },
            error: (jqXHR, textStatus, errorThrown) => {

            }
        })
    }

    static addTool(tool, parentId, experimentId, callback) {
        $.ajax({
            type: "POST",
            url: `/experiment/${experimentId}/add_tool`,
            data: {tool: tool, parent_id: parentId},
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            success: (data, textStatus, jqXHR) => {
                callback()
            },
            error: (jqXHR, textStatus, errorThrown) => {

            }
        })
    }

    static deleteTool(toolId, experimentId, callback) {
        $.ajax({
            type: "POST",
            url: `/experiment/${experimentId}/delete_tool`,
            data: {tool_id: toolId},
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            success: (data, textStatus, jqXHR) => {
                callback()
            },
            error: (jqXHR, textStatus, errorThrown) => {

            }
        })
    }

    static openToolConfig(toolId, experimentId, callback) {
        $.ajax({
            type: "POST",
            url: `/experiment/${experimentId}/edit_tool_form`,
            data: {tool_id: toolId},
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            },
            error: (jqXHR, textStatus, errorThrown) => {

            }
        })
    }

    static editTool(toolId, parameters, experimentId, callback) {
        $.ajax({
            type: "POST",
            url: `/experiment/${experimentId}/edit_tool`,
            data: {tool_id: toolId, parameters: parameters},
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            success: (data, textStatus, jqXHR) => {
                callback()
            },
            error: (jqXHR, textStatus, errorThrown) => {

            }
        })
    }

    static runTool(toolId, experimentId, callback) {
        $.ajax({
            type: "POST",
            url: `/experiment/${experimentId}/run_tool`,
            data: {tool_id: toolId},
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            },
            error: (jqXHR, textStatus, errorThrown) => {

            }
        })
    }
}