export class DatasetAPI {
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

    static delete_dataset(datasetId, callback) {
        $.ajax({
            type: "POST",
            url: "/dataset/delete",
            data: {dataset_id: datasetId},
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
            url: "/datasets/add_selected_documents",
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                documents_ids: documentsIds
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }

    static removeSelectedDocumentsToWorkingDataset(documentsIds, callback) {
        $.ajax({
            type: "POST",
            url: "/datasets/remove_selected_documents",
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                documents_ids: documentsIds
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }

    static addAllDocumentsToWorkingDataset(searchParams, callback) {
        $.ajax({
            type: "POST",
            url: "/datasets/add_all_documents",
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                search_params: searchParams
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }

    static exportDataset(datasetId, callback) {
        $.ajax({
            type: "POST",
            url: "/datasets/export_dataset",
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

    static paginateDataset(datasetId, page, per_page, nb_pages, sort, sort_order, type, callback) {
        $.ajax({
            type: "POST",
            url: `/dataset/${datasetId}/paginate`,
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                page: page, per_page: per_page, nb_pages: nb_pages, sort: sort, sort_order: sort_order, type: type
            },
            dataType: "json",
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