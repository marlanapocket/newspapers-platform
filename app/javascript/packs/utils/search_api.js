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

    static load_named_entities(docs_ids, callback) {
        $.ajax({
            type: "POST",
            url: "/named_entities",
            data: {docs_ids: docs_ids},
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

    static confirm_compond_creation(article_parts, callback) {
        $.ajax({
            type: "POST",
            url: `/catalog/confirm_compound_creation`,
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                article_parts: article_parts
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }

    static create_compound(title, all_text, issue_id, article_parts_ids, callback) {
        $.ajax({
            type: "POST",
            url: `/catalog/create_compound`,
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                article_parts_ids: article_parts_ids,
                title: title,
                all_text: all_text,
                issue_id: issue_id
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }

    static delete_compound_article(compound_id, callback) {
        $.ajax({
            type: "POST",
            url: `/catalog/delete_compound`,
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
                compound_id: compound_id
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }

    static random_sample(callback) {
        $.ajax({
            type: "POST",
            url: `/catalog/random_sample`,
            headers: {
                'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
            },
            data: {
            },
            success: (data, textStatus, jqXHR) => {
                callback(data)
            }
        })
    }
}