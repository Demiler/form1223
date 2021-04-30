import { LitElement, html, css } from 'lit-element'
import './time-picker.js'
import * as utils from './utils'

class DatePicker extends LitElement {
    static get styles() {
        return css`
            :host {
                width: inherit;
            }

            input {
                box-sizing: border-box;

                border: none;
                background: #eee;

                padding: 5px 5px 2px 5px;
                border-bottom: 3px solid #eee;
                border-radius: 5px;

                font: inherit;
                width: inherit;
                text-align: inherit;

                transition: border-color .3s;
            }

            input:focus {
                outline: none;
                border-color: #87c1ff;
            }

            input.error {
                outline: none;
                border-color: #f7c1ff;
            }

            #date-picker {
                display: block;
                opacity: 1;
                position: absolute;
                z-index: 2;
                box-shadow: 0 0 5px 1px #000000a0;
                left: -5px;
                top: calc(100% + 20px);
            }

            #date-picker[hidden] {
                opacity: 0;
                z-index: -999;
            }
        `;
    }

    static get properties() {
        return {
            value: { type: String },
        }
    }

    constructor() {
        super();

        const today = new Date();
        this.day = today.getDate();
        this.month = today.getMonth();
        this.year = today.getFullYear();

        this.min = "2000-1-1";
        this.max = this.formatDate();
        this.value = this.max;
        this.prettyDate = this.makePretty();
    }

    firstUpdated() {
        this.inputEl = this.shadowRoot.querySelector("#date-input");
        this.pickerEl = this.shadowRoot.querySelector("#date-picker");
        this.addEventListener('blur', this.hidePicker);

        if (this.hasAttribute("value")) {
            this.setDateFromString(this.value);
            this.prettyDate = this.makePretty();
            this.requestUpdate();
        }
    }

    render() {
        return html`
            <input id="date-input" value=${this.prettyDate} type="text"
            spellcheck="false"
            @focus=${this.showPicker}
            @input=${this.parse}
            @change=${this.changeDate}
            @keyup=${this.checkKeyUp}
            >

            <app-datepicker tabindex="-1"
                value=${this.value}
                id="date-picker"
                @datepicker-value-updated=${this.updateDate}
                firstDayOfWeek="1"
                min=${this.min}
                max=${this.max}
                inline
                hidden
            ></app-datepicker>
        `;
    }

    setDateFromString(str) {
        const vals = str.split('-');
        this.day = Number(vals[2]);
        this.month = Number(vals[1]) - 1;
        this.year = Number(vals[0]);
    }

    updateDate(e) {
        this.setDateFromString(e.target.value);
        this.value = this.formatDate();
        this.prettyDate = this.makePretty();
        this.changeDate();
    }

    parse(e) {
        if (e.target.value === "")
            return;

        let vals = e.target.value.replace(/[\\\/ -]+/g, '/').split('/');
        const date = new Date(
            vals[2] < 100 ? 2000 + Number(vals[2]) : vals[2],
            utils.getMonthFromString(vals[1]),
            vals[0]);

        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const value = this.formatDate(day, month, year.pad(4));
        console.log(day, month, year, value);

        if (!utils.isValidDate(date) || value < this.min || value > this.max)
            return;

        this.day = day;
        this.month = month;
        this.year = year;

        this.value = value;
        this.pickerEl.value = this.value;
        this.prettyDate = this.makePretty();
        this.sendChange();
    }

    makePretty() {
        return this.day + " " + utils.MONTHS[this.month] + " " + this.year;
    }

    formatDate(day = this.day, month = this.month, year = this.year) {
        return year + "-" + (month + 1) + "-" + day;
    }

    changeDate(e) {
        this.inputEl.value = this.prettyDate;
        this.sendChange();
    }

    sendChange(type) {
        let event = new CustomEvent('date-update', {
            detail: this.getData(),
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    showPicker() {
        this.pickerEl.hidden = false;
    }

    hidePicker() {
        this.pickerEl.hidden = true;
    }

    checkKeyUp(e) {
        if (e.key === "Enter")
            this.hidePicker();
    }

    getData() {
        return {
            value: this.value,
            day: this.day,
            month: this.month,
            year: this.year,
        }
    }
}

customElements.define('date-picker', DatePicker);
