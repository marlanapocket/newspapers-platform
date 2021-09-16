export class ServerAPI {

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

    static create_dataset(title, callback) {
        $.ajax({
            type: "POST",
            url: "/dataset/create",
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

    static update_datasets_list(callback) {
        $.ajax({
            type: "GET",
            url: "/datasets/update",
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

    static setCurrentWorkingDataset(datasetId, callback) {
        $.ajax({
            type: "POST",
            url: "/datasets/working_dataset",
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                dataset_id: datasetId
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }

    static addSelectedDocumentsToWorkingDataset(documentsIds, callback) {
        $.ajax({
            type: "POST",
            url: "/datasets/add_documents",
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                documents_ids: documentsIds
            },
            dataType: "script",
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }

    static paginateDataset(datasetId, page, per_page, sort, sort_order, type, callback) {
        $.ajax({
            type: "POST",
            url: `/dataset/${datasetId}/paginate`,
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                page: page, per_page: per_page, sort: sort, sort_order: sort_order, type: type
            },
            dataType: "script",
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }

    static getDatasets(callback) {
        $.ajax({
            type: "GET",
            url: `/datasets/list`,
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            dataType: "script",
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }
}

