import { LitElement, html, css } from 'lit-element'
import * as utils from './utils'
import './labled-input'

class FromToInput extends LitElement {
    static get styles() {
        return css`
            :host {
                --title-width: 100px;
                --input-width: 80px;

                margin-top: 20px;
                margin-bottom: 20px;

                display: block;
                width: -moz-fit-content;
                width: -webkit-fit-content;
                border-bottom: 1.2px solid grey;

                border-radius: 5px 5px 0 0;
                padding: 0 5px;
            }

            :host(.active) {
                background-color: #cfe6ff;
            }

            :host(.error) {
                background-color: #ffa6af;
            }

            :host(.active.error) {
                background: linear-gradient(95deg, #cfe6ff, #ffa6af);
            }

            .title {
                width: var(--title-width);
                display: inline-block;
            }

            .value {
                display: inline-block;
                width: var(--input-width);
                border: none;
                outline: none;
                background-color: transparent;
            }

        `;
    }

    static get properties() {
        return {
            active: { type: Boolean },
            value: { type: Object },
            min: { type: Number },
            max: { type: Number },
        };
    }

    constructor() {
        super();
        this.active = false;
        this.value = { from: null, to: null };
        this.err = { from: false, to: false };
    }

    firstUpdated() {
        this.addEventListener('blur', () => {
            if (this.value.from !== null && this.value.to !== null && this.value.from > this.value.to)
                this.swap();
            this.deactivate()
        })

        if (isNaN(this.value.from) || isNaN(this.value.to)) {
            this.error("from");
            this.requestUpdate();
        }

        this.inputFromEl = this.shadowRoot.querySelector("#from");
        this.inputToEl = this.shadowRoot.querySelector("#to");
    }

    render() {
        return html`
            <slot class='title'></slot>
            <labled-input id="from" class='value' label="From"
            .value=${this.value.from}
            @focus=${this.activate}
            @change=${this.change}
            @input=${this.change}
            @keyup=${this.onKeyUp}
            ></labled-input>

            <labled-input id="to" class='value' label="To"
            .value=${this.value.to}
            @focus=${this.activate}
            @input=${this.change}
            @change=${this.change}
            @keyup=${this.onKeyUp}
            ></labled-input>
        `;
    }

    onKeyUp(e) {
        if (e.code === "Enter") {
            e.target.blur();
            if (e.target === this.inputFromEl) {
                this.inputToEl.focus();
            }
            this.sendChange();
        }
    }

    swap() {
        let temp = this.value.from;
        this.value.from = this.value.to;
        this.value.to = temp;
        this.sendChange();
        this.requestUpdate();
    }

    sendChange() {
        let event = new CustomEvent('update', { 
            detail: { from: this.value.from, to: this.value.to },
            bubbles: true, 
            composed: true });
        this.dispatchEvent(event);
    }

    change(e) {
        if (utils.isBlank(e.target.value)) {
            this.value[e.target.id] = null;
            return;
        }

        let newVal = Number(e.target.value);

        if (isNaN(newVal)) {
            this.error(e.target.id);
        }
        else {
            this.unerror(e.target.id);

            if (this.min !== undefined)
                newVal = Math.max(newVal, this.min);
            if (this.max !== undefined)
                newVal = Math.min(newVal, this.max);

            this.value[e.target.id] = newVal;
            e.target.value = String(newVal);
            this.sendChange();
            this.requestUpdate();
        }
    }

    activate() {
        this.active = true;
        this.classList.add('active');
    }

    deactivate() {
        this.active = false;
        this.classList.remove('active');
    }

    error(id) {
        if (!this.err[id]) {
            this.err[id] = true;
            this.classList.add('error');
        }
    }

    unerror(id) {
        if (this.err[id]) {
            this.err[id] = false;
            if (this.err.from === false && this.err.to == false)
                this.classList.remove('error');
        }
    }
}

customElements.define('fromto-input', FromToInput);
