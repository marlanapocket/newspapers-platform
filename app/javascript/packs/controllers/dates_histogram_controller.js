import { Controller } from "stimulus"
import {SearchAPI} from "../utils/search_api"
import Chart from "chart.js/auto"
import zoomPlugin from 'chartjs-plugin-zoom'


export default class extends Controller {
    static targets = []
    static values = {years: Object, months: Object}

    wide_chart = null

    connect() {
        Chart.register(zoomPlugin)
        this.setup_dates_histogram()
        this.setup_wide_dates_histogram()
        $("#wide_date_histogram").click( event => {
            SearchAPI.wideDatesHistogram( data => {
                $("#wide_dates_histogram_modal").html(data.modal_content)
                let myModal = new bootstrap.Modal(document.getElementById('wide_dates_histogram_modal'), {})
                myModal.toggle()
            })
        })
    }

    setup_wide_dates_histogram() {
        $("#wide_dates_histogram_modal").on("shown.bs.modal", (e) => {
            this.generate_chart(this.yearsValue)
        })
        $("body").on('click', "#download_histogram", e => {
            const b64data = $("#canvas_wide_dates_histogram")[0].toDataURL()
            $("#download_histogram").attr('href', b64data)
        })
        $("body").on('click', "#reset_zoom_histogram", (e) => {
            this.wide_chart.resetZoom()
        })
        $("body").on('change', 'input[name="hist_type_input"]', (e) => {
            if(e.target.value == "year")
                this.generate_chart(this.yearsValue)
            if(e.target.value == "month")
                this.generate_chart(this.monthsValue)
        })
    }

    setup_dates_histogram() {
        const labels = []
        const values = []
        for(const [k,v] of Object.entries(this.yearsValue)) {
            labels.push(k)
            values.push(v)
        }
        const dataset = {}
        dataset['label'] = "Date frequencies"
        dataset['backgroundColor'] = 'rgba(0, 0, 0, 0.1)'
        dataset['borderColor'] =  'rgba(0, 0, 0, 0.5)'
        dataset['lineTension'] = 0.4
        dataset['fill'] = 'origin'
        dataset['borderWidth'] = 1
        dataset['hidden'] = false
        dataset['data'] = values
        const ctx = $("#canvas_dates_histogram")
        const opts = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [dataset]
            },
            options: opts
        })
    }

    generate_chart(data) {
        if(this.wide_chart)
            this.wide_chart.destroy()
        //CatalogIndex.big_chart.destroy() if CatalogIndex.big_chart?
        const labels = []
        const values = []
        const keys = Object.keys(data).sort()
        for(const k of keys) {
            labels.push(k)
            values.push(data[k])
        }
        const dataset = {}
        dataset['label'] = "Date frequencies"
        dataset['backgroundColor'] = 'rgba(0, 0, 0, 0.1)'
        dataset['borderColor'] =  'rgba(0, 0, 0, 0.5)'
        dataset['lineTension'] = 0.4
        dataset['fill'] = 'origin'
        dataset['borderWidth'] = 1
        dataset['hidden'] = false
        dataset['data'] = values
        const ctx = $("#canvas_wide_dates_histogram")
        const opts = {
            responsive: true,
            maintainAspectRatio: false,
            tooltips:{
                enabled: false
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                zoom: {
                    pan: {
                        enabled: true
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    }
                }
            }
        }
        //CatalogIndex.big_chart = new Chart(ctx, {
        this.wide_chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [dataset]
            },
            options: opts
        })
    }
}