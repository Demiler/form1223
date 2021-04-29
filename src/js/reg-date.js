import { LitElement, html, css } from 'lit-element'
import 'app-datepicker'
import './date-picker'
import './time-picker'
import * as utils from './utils'

class RegDate extends LitElement {
    static get styles() {
        return css`
            :host {
                position: relative;
            }

            .value {
                margin-bottom: 10px;
            }

            .time {
                width: 80px;
                text-align: center;
            }

            .date {
                width: 120px;
                margin-right: 8px;
            }

            .label {
                display: inline-block;
                margin-right: 8px;
                width: 50px;
            }
        `;
    }

    static get properties() {
        return {
        };
    }

    constructor() {
        super();
        this.from = { date: null, time: null };
        this.to = { date: null, time: null };
    }

    firstUpdated() {
        this.from.date = this.shadowRoot.querySelector("#from .date").getData();
        this.from.time = this.shadowRoot.querySelector("#from .time").getData();
        this.to.date   = this.shadowRoot.querySelector("#to .date").getData();
        this.to.time   = this.shadowRoot.querySelector("#to .time").getData();
    }

    render() {
        return html`
            <div class='value' id="from">
                <span class='label'>От</span>

                <date-picker name="from" class='date'
                value="2000-04-28"
                @date-update=${this.updateDate}
                ></date-picker>

                <time-picker name="from" class='time'
                @time-update=${this.updateTime}
                ></time-picker>
            </div>

            <div class='value' id="to">
                <span class='label'>До</span>

                <date-picker name="to" class='date'
                @date-update=${this.updateDate}
                ></date-picker>

                <time-picker name="to" class='time'
                @time-update=${this.updateTime}
                ></time-picker>
            </div>
        `;
    }

    sendChange() {
        let event = new CustomEvent('reg-update', {
            detail: this.getData(),
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }

    updateTime(e) {
        const name = e.target.getAttribute("name");
        this[name].time = e.detail;
        this.sendChange();
    }

    updateDate(e) {
        const name = e.target.getAttribute("name");
        this[name].date = e.detail;
        this.sendChange();
    }

    getData() {
        return {
            from: this.from,
            to: this.to
        };
    }
};

customElements.define('reg-date', RegDate);
