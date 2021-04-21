import { LitElement, html, css } from 'lit-element'

class PsInput extends LitElement {
    static get styles() {
        return css`
            :host {
                --title-width: 100px;
                --input-width: 80px;

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
                width: var(--input-width);
                border: none;
                outline: none;
                background-color: transparent;
            }
        `;
    }

    static get properties() {
        return {
            err: { type: Boolean },
            active: { type: Boolean },
            value: { type: Number }
        };
    }

    constructor() {
        super();
        this.err = false;
        this.active = false;
        this.autoupdateRefresh = 300;
    }

    firstUpdated() {
        this.addEventListener('click', this.activate)
        this.addEventListener('blur', this.deactivate)
        this.inputEl = this.shadowRoot.querySelector("input");

        if (isNaN(this.value))
            this.error();
    }

    render() {
        return html`
            <slot class='title'></slot>
            <input class='value' .value=${this.value}
            @focus=${this.activate}
            @keyup=${this.autoupdate}
            @change=${this.change}>
        `;
    }

    updateVal(newVal) {
        if (isNaN(newVal)) {
            this.error();
            return;
        }
        this.unerror();

        this.value = newVal;
        let event = new CustomEvent('update', { 
            detail: { value: this.value },
            bubbles: true, 
            composed: true });
        this.dispatchEvent(event);
    }

    autoupdate(e) {
        clearTimeout(this.autoUpdateTimer);
        this.autoUpdateTimer = setTimeout(() =>
            this.updateVal(Number(this.inputEl.value)),
            this.autoupdateRefresh
        );
    }

    change(e) {
        this.updateVal(Number(e.target.value));
    }

    activate() {
        this.active = true;
        this.classList.add('active');
        this.inputEl.focus();
    }

    deactivate() {
        this.active = false;
        this.classList.remove('active');
        this.inputEl.blur();
    }

    toggle() {
        if (this.active)
            this.deactivate();
        else
            this.activate();
    }

    error() {
        if (!this.err) {
            this.err = true;
            this.classList.add('error');
        }
    }

    unerror() {
        if (this.err) {
            this.err = false;
            this.classList.remove('error');
        }
    }
}

customElements.define('ps-input', PsInput);
