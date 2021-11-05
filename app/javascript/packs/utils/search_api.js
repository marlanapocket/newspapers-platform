export class SearchAPI {

    static load_dataset_named_entities(dataset_id, callback) {
        $.ajax({
            type: "POST",
            url: "/dataset_named_entities",
            data: {dataset_id: dataset_id},
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

    static load_named_entities(doc_id, callback) {
        $.ajax({
            type: "POST",
            url: "/named_entities",
            data: {doc_id: doc_id},
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

    static facetPagination(fieldName, nbPages, currentPage, callback) {
        $.ajax({
            type: "POST",
            url: "/catalog/facet_pagination",
            data: {field_name: fieldName, nb_pages: nbPages, current_page: currentPage},
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

    static wideDatesHistogram(callback) {
        $.ajax({
            type: "POST",
            url: "/catalog/wide_dates_histogram",
            data: {},
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