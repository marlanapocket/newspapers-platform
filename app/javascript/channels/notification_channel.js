import consumer from "./consumer"

consumer.subscriptions.create("NotificationChannel", {
    connected() {
        // Called when the subscription is ready for use on the server
        // console.log("connected")
    },

    disconnected() {
        // Called when the subscription has been terminated by the server
    },

    received(data) {
        // Called when there's incoming data on the websocket for this channel
        // console.log("received: ", data)
        switch(data.type) {
            case "refresh_display":
                $("#experiment_area").html(data.html)
                $("#experiment_area").attr("data-refresh", (!$("#experiment_area").attr("data-refresh")))
                break
            case "notify":
                if(window.location.pathname == "/search") {
                    const selected_dataset = $("#working_dataset_select").val()
                    $("#working_dataset_select").html(data.dataset_options)
                    $("#working_dataset_select").val(selected_dataset)
                }
                $("#notifications").append(data.html)
                for(const notif of $('.toast')) {
                    const notifToast = bootstrap.Toast.getOrCreateInstance(notif)
                    notifToast.show()
                    notif.addEventListener('hidden.bs.toast', (event) => {
                        bootstrap.Toast.getOrCreateInstance(event.target).dispose()
                        event.target.remove()
                    })
                }
                break
            case "completion_rate":
                if(window.location.pathname == `/experiment/${data.experiment_id}`) {
                    const progress_bar = $(`#tool_${data.tool_id}`).find(".completion-rate").find('.progress-bar')
                    progress_bar.attr("style", `width: ${data.completion}%;`)
                    progress_bar.attr("aria-valuenow", data.completion)
                    progress_bar.html(`${data.completion}%`)
                }
                break
            case "experiment_finished":
                // $("#experiment_status").html(data.message)
                $("#experiment_loader").removeClass("spinner-border")
                $("#run_experiment_button").attr("disabled", false)
                $("#run_experiment_button span").html("Run experiment")
                break
        }
    }
});
