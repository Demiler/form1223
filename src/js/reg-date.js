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
        this.from = { date: "2000-01-01", time: "00:00:00" };
        this.to = { date: "2021-01-01", time: "00:00:00" };
    }


    setupAttributes() {
        if (this.setupAttrCalled) return;
        this.setupAttrCalled = true;

        [ "date-from", "date-to", "time-from", "time-to" ]
            .forEach(attr => {
                let [ what, from ] = attr.split('-');
                if (this.hasAttribute(attr))
                    this[from][what] = this.getAttribute(attr);
            });
        this.requestUpdate();
    }

    render() {
        this.setupAttributes();

        return html`
            <div class='value' id="from">
                <span class='label'>От</span>

                <date-picker name="from" class='date'
                value=${this.from.date}
                @date-update=${this.updateDate}
                ></date-picker>

                <time-picker name="from" class='time'
                value=${this.from.time}
                @time-update=${this.updateTime}
                ></time-picker>
            </div>

            <div class='value' id="to">
                <span class='label'>До</span>

                <date-picker name="to" class='date'
                value=${this.to.date}
                @date-update=${this.updateDate}
                ></date-picker>

                <time-picker name="to" class='time'
                value=${this.to.time}
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
        this[name].time = e.detail.value;
        this.sendChange();
    }

    updateDate(e) {
        const name = e.target.getAttribute("name");
        this[name].date = e.detail.value;
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
