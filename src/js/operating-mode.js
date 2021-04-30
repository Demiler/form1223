import { LitElement, html, css } from 'lit-element'

class OpMode extends LitElement {
    static get styles() {
        return css`
            :host {
                display: flex;
            }

            .btn {
                border:none;
                display: inline-block;
                padding: 5px;
                background-color: #d1d1d1;
                border-radius: 8px;
                width: 100%;
                text-align: center;
                text-transform: uppercase;
                transition: .2s;
                cursor: pointer;
                height: 40px;
            }

            .btn.active {
                background-color: #cfe6ff;
            }

            .btn:not(:last-child) {
                margin-right: 20px;
            }
        `;
    }

    static get properties() {
        return {
        };
    }

    constructor() {
        super();
    }

    firstUpdated() {
        if (this.value)
            this.current = this.shadowRoot.querySelector(`#${this.value}`);
        else
            this.current = this.shadowRoot.querySelector("#eas");
        this.current.classList.add('active');
    }

    render() {
        return html`
            <button id="eas" class='btn'    @click=${this.pick}>EAS</button>
            <button id="dust" class='btn'   @click=${this.pick}>DUST</button>
            <button id="tle" class='btn'    @click=${this.pick}>TLE</button>
            <button id="meteor" class='btn' @click=${this.pick}>METEOR</button>
        `;
    }

    pick(e) {
        if (this.current === e.target)
            return;
        this.current.classList.remove('active');
        e.target.classList.add('active');
        this.current = e.target;

        let event = new CustomEvent('update', {
            detail: this.getData(),
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }

    getData() {
        return {
            value: this.current.id
        };
    }
}

customElements.define('op-mode', OpMode);
