import { Controller } from "stimulus"

export default class extends Controller {
    connect() {
        console.log("Connected.")
    }
    greet() {
        console.log("Hello, Stimulus!", this.element)
    }
}