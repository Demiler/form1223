import { LitElement, html, css } from 'lit-element'
import './dropdown-menu'
import 'app-datepicker'

class RegDate extends LitElement {
    static get styles() {
        return css`
            #reg-date {
                width: 300px;
                height: 50px;
                box-sizing: border-box; position: relative;
            }

            #date-preview {
            }

            #date-preview .title {
                background-color: white;
                padding: 0 5px;
                border-radius: 5px;
                margin-bottom: 5px;
            }

            #date-preview .value {
                border: 1.2px solid grey;
                border-radius: 5px;
                padding: 2px 5px;
            }

            #date-picker {
                display: none;
                opacity: .2;
                position: absolute;
                top: 50px;
                transition: .2s;
            }

            #date-picker[hidden] {
                top: -100%;
            }

        `;
    }

    static get properties() {
        return {
            dt: { type: String },
        };
    }

    constructor() {
        super();
        this.dt = "nothing";
        this.elements = {};
    }

    firstUpdated() {
        this.elements.date = this.shadowRoot.querySelector("#date-picker");
    }

    render() {
        return html`
            <div id="reg-date">
                <div id="date-preview" @click=${this.openPicker}>
                    <div class='title'>Registration date</div>
                    <div class='value'>${this.dt}</div>
                </div>
                <app-datepicker
                    id = "date-picker"
                    @datepicker-value-updated = ${this.updateDate}
                    inline
                    hidden
                ></app-datepicker>
            </div>
        `;
    }

    updateDate(e) {
        console.log(e);
        this.dt = e.detail.value;
    }

    openPicker() {
        this.elements.date.hidden = !this.elements.date.hidden;
    }
};

customElements.define('reg-date', RegDate);
