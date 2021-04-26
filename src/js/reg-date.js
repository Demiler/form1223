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
            value: { type: Object },
        };
    }

    constructor() {
        super();
        let curDate = utils.getCurrentDate();
        this.value = { from: curDate, to: curDate };
    }

    firstUpdated() {
        this.dateEl = this.shadowRoot.querySelector("#date-picker");
    }

    render() {
        return html`
            <div class='value' id="from">
                <span class='label'>From</span>
                <date-picker class='date'
                @focus=${this.chooseDate}
                ></date-picker>

                <time-picker class='time'>
                </time-picker>
            </div>

            <div class='value' id="to">
                <span class='label'>To</span>
                <date-picker class='date'
                @focus=${this.chooseDate}
                ></date-picker>

                <time-picker class='time'>
                </time-picker>
            </div>
        `;
    }

};

customElements.define('reg-date', RegDate);
