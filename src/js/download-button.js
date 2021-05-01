import { LitElement, html, css } from 'lit-element'
import { server } from './serverApi'

class DownloadButton extends LitElement {
    static get styles() {
        return css`
            :host {
                position: relative;
            }

            :host(.waiting)::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                background: #a5a5a552;
                cursor: wait;
            }

            button {
                margin-bottom: 10px;
                border: none;
                background-color: #d1d1d1;
                font: inherit;
                padding: 5px 15px;
                width: 100%;
                border-radius: 5px;
                transition: .2s;
            }

            button:focus-visible,
            button:hover {
                background-color: #daecff;
            }

            button:active {
                background-color: #cfe6ff;
                transform: scale(1.2);
            }

            #file-limit {
                border-bottom: 1px solid black;
                font-size: 10pt;
                width: 100%;
                display: flex;
            }

            #file-limit input {
                outline: none;
                border: none;
                width: 100%;
                font-size: inherit;
                text-align: right;
                padding: 0 5px;
                -moz-appearance: textfield;
            }

            #file-limit input::-webkit-outer-spin-button,
            #file-limit input::-webkit-inner-spin-button {
                -webkit-appearance: none;
            }
        `;
    }

    static get properties() {
        return {
            filesLimit: { type: Number },
        }
    }

    constructor() {
        super();
        this.filesLimit = 10;
    }

    firstUpdated() {
        if (this.hasAttribute("value"))
            this.filesLimit = Number(this.getAttribute("value"));
        this.linkEl = this.shadowRoot.querySelector("#download");
    }

    render() {
        return html`
            <button id="send-data" @click=${this.sendRequest}><slot></slot></button>
            <div id="file-limit">
                <span class='label'>Файлов:</span>
                <input type="number" value=${this.filesLimit}
                @change=${this.changeLimit}>
            </div>
            <a id="download" target="_blank" hidden>Download</a>
        `;
    }

    wait() {
        this.classList.add("waiting");
    }

    unwait() {
        this.classList.remove("waiting");
    }

    download(href) {
        this.linkEl.href = href;
        this.linkEl.click();
    }

    sendRequest(e) {
        let event = new CustomEvent('request', {
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }

    changeLimit(e) {
        this.filesLimit = Number(e.target.value);
        if (this.filesLimit < 1) {
            this.filesLimit = 1;
            e.target.value = 1;
        }
        this.sendChange();
    }

    sendChange() {
        let event = new CustomEvent('change', {
            detail: this.getData(),
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }

    getData() {
        return {
            value: this.filesLimit
        }
    }
};

customElements.define('download-button', DownloadButton);
