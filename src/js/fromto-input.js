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
    }

    render() {
        return html`
            <slot class='title'></slot>
            <labled-input id="from" class='value' label="From"
            .value=${this.value.from}
            @focus=${this.activate}
            @change=${this.change}
            @input=${this.change}
            ></labled-input>

            <labled-input id="to" class='value' label="To"
            .value=${this.value.to}
            @focus=${this.activate}
            @input=${this.change}
            @change=${this.change}
            ></labled-input>
        `;
    }

    swap() {
        let temp = this.value.from;
        this.value.from = this.value.to;
        this.value.to = temp;
        this.requestUpdate();
    }

    updateVal() {
        let event = new CustomEvent('update', { 
            detail: { value: this.value },
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
        console.log(e.target.value, newVal);

        if (isNaN(newVal)) {
            this.error(e.target.id);
        }
        else {
            this.unerror(e.target.id);
            this.value[e.target.id] = newVal;
            this.updateVal();
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
