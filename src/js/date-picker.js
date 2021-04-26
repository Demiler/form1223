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

            #date-picker {
                display: block;
                opacity: 1;
                position: absolute;
                transition: opacity .2s;
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
        this.MONTHS =
            ["Jan", "Feb", "Mar", "Apr", "May",
            "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const today = new Date();
        this.day = today.getDate();
        this.month = today.getMonth();
        this.year = today.getFullYear();

        this.min = "2000-1-1";
        this.max = this.formatToPickerDate();
        this.formatValue();
        this.date = this.value;
    }

    firstUpdated() {
        this.inputEl = this.shadowRoot.querySelector("#date-input");
        this.pickerEl = this.shadowRoot.querySelector("#date-picker");
        this.addEventListener('blur', this.hidePicker);
    }

    render() {
        return html`
            <input id="date-input" .value=${this.date} type="text"
            @focus=${this.showPicker}
            @input=${this.parse}
            @change=${this.changeDate}
            @keyup=${this.checkKeyUp}
            >

            <app-datepicker tabindex="-1"
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

    updateDate(e) {
        const vals = e.detail.value.split('-');
        this.day = Number(vals[2]);
        this.month = Number(vals[1]) - 1;
        this.year = Number(vals[0]);
        this.formatValue();
        this.changeDate();
        this.sendChange();
    }

    parse(e) {
        let vals = e.target.value.replace(/[\\\/ -]+/g, '/').split('/');
        const date = new Date(
            vals[2] < 100 ? 2000 + Number(vals[2]) : vals[2],
            utils.getMonthFromString(vals[1]),
            vals[0]);

        if (!utils.isValidDate(date) || Number(date.getFullYear()) < 2000)
            return;


        this.day = date.getDate();
        this.month = date.getMonth();
        this.year = date.getFullYear();

        this.setPickerDate();
        this.formatValue();
        this.sendChange();
    }

    formatToPickerDate() {
        return this.year + "-" + (this.month + 1) + "-" + this.day;
    }

    setPickerDate() {
        this.pickerEl.value = this.formatToPickerDate();
    }

    formatValue() {
        this.value = this.day + " " + this.MONTHS[this.month] + " " + this.year;
    }

    changeDate(e) {
        this.inputEl.value = this.value;
        this.sendChange();
    }

    updateTime() {
        let event = new CustomEvent('time-change', {
            detail: {
            },
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }

    sendChange(type) {
        let event = new CustomEvent('change', {
            detail: {
                string: this.value,
                day: this.day,
                month: this.month,
                year: this.year,
            },
            bubbles: true,
            composed: true });
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
}

customElements.define('date-picker', DatePicker);
