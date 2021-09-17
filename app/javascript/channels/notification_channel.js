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
        if (data.type === "update_experiment_view") {
            $("#experiment_area").html(data.html)
            $("#experiment_area").attr("data-refresh", (!$("#experiment_area").attr("data-refresh")))
        }
        else if (data.type === "refresh_display") {
            $("#experiment_area").html(data.html)
            $("#experiment_area").attr("data-refresh", (!$("#experiment_area").attr("data-refresh")))
        }
    }
});
