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
    static rename_dataset(id, title, callback) {
        $.ajax({
            type: "POST",
            url: "/dataset/rename",
            data: {id: id, title: title},
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
    static import_dataset(id, title, callback) {
        $.ajax({
            type: "POST",
            url: "/dataset/import",
            data: {original_dataset_id: id, title: title},
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

    static addSelectedCompoundToWorkingDataset(compoundId, callback) {
        $.ajax({
            type: "POST",
            url: "/datasets/add_compound",
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                compound_id: compoundId
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

    static exportDataset(datasetId, exportType, callback) {
        $.ajax({
            type: "POST",
            url: "/datasets/export_dataset",
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                dataset_id: datasetId,
                export_type: exportType
            },
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

    static toggleSharingStatus(dataset_id, callback) {
        $.ajax({
            type: "POST",
            url: `/dataset/toggle_sharing_status`,
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                dataset_id: dataset_id
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }
}