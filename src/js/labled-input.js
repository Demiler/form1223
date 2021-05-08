import { LitElement, html, css } from 'lit-element'
import * as utils from './utils'

class LabledInput extends LitElement {
    static get styles() {
        return css`
            :host {
                --font-size: 15px;
                --scale: .7;

                position: relative;
            }

            .label {
                position: absolute;
                transform: scale(1) translate(0, 0);
                transition: transform .2s;

                transform-origin: top left;
            }

            .label.active {
                transform: scale(var(--scale)) translateY(
                    calc(-1.4 * var(--font-size) * var(--scale)));
                opacity: .5;
            }

            input {
                width: inherit;
                outline: none;
                border: none;
                background: transparent;
                padding: 0;
                transition: .2s;
            }

        `;
    }

    static get properties() {
        return {
            value: { type: String },
            label: { type: String },
            active: { type: Boolean },
        };
    }

    constructor() {
        super();
        this.active = false;
        this.focused = false;
    }

    firstUpdated() {
        this.active = !utils.isBlank(this.value) || this.value === 0;
        this.inputEl = this.shadowRoot.querySelector("input");
        this.addEventListener('click', () => this.inputEl.focus());

        //if (this.value === null || this.value === undefined)
            //this.value = "";
    }

    render() {
        return html`
            <span class='label${this.active ? ' active' : ''}'
            >${this.label}</span>
            <input .value=${this.value}
                @blur=${this.blured}
                @focus=${this.focusev}
                @input=${this.change}
                @change=${this.change}
                @keyup=${utils.redispatchEvent}
            >
        `;
    }

    update(props) {
        super.update(props);
        if (props.has('value'))
            this.active = this.focused || !utils.isBlank(this.value) || this.value === 0;
    }

    focus() {
        this.inputEl.focus();
    }

    blur() {
        this.inputEl.blur();
    }

    focusev() {
        this.active = this.focused = true;
    }

    blured() {
        this.focused = false;
        this.active = !utils.isBlank(this.value) || this.value === 0;
    }

    change(e) {
        utils.redispatchEvent(e);
        this.value = e.target.value;
        this.active = this.focused || !utils.isBlank(this.value) || this.value === 0;
    }

}

customElements.define('labled-input', LabledInput);
