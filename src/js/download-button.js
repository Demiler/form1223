import { LitElement, html, css } from 'lit-element';
import { genToken } from './utils';

class DownloadButton extends LitElement {
    static get styles() {
        return css`
            :host {
                position: relative;
                display: block;
                border-radius: inherit;
            }

            :host(.waiting)::before {
                content: '';
                position: absolute;
                width: calc(100% + 10px);
                height: calc(100% + 10px);
                top: -5px;
                left: -5px;
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

            #download {
                display: none;
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
            <a id="download" download></a>
        `;
    }

    wait() {
        this.classList.add("waiting");
    }

    unwait() {
        this.classList.remove("waiting");
    }

    download(body) {
        this.wait();

        console.log('sending request');
        fetch(`${window.location.href}get`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/plain'
            },
            body
        })
        .then(res => {
            this.unwait();

            switch (res.status) {
                case 404:
                    this.sendNotFound(); break;
                case 200:
                    res.text().then(id => this.downloadData(id)); break;
                default:
                    this.sendError()
            }
        })
        .catch(err => {
            console.log('some error', err);
            this.unwait();
            this.sendError("Неудалось послать запрос.");
        });
    }

    askForErrors(token) {
        fetch(`${window.location.href}errors?token=${token}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        })
        .then(async res => {
            if (res.status === 200) {
                let amount;
                await res.json().then(arr => amount = arr.length);
                if (amount > 0)
                    this.sendError(`Возникла ошибка при обработке нескольких (${amount}) файлов`);
            }
        })
        .catch(() => {}); //ignore
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

    downloadData(id) {
        this.wait();
        const token = genToken(12);
        this.linkEl.href = `${window.location.href}download?id=${id}&token=${token}`;
        this.linkEl.click();
        setTimeout(() => this.askForErrors(token), 2000);
        setTimeout(() => this.unwait(), 2000);
    }

    sendError(error) {
        let event = new CustomEvent('error', {
            detail: error,
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }

    sendNotFound() {
        let event = new CustomEvent('notfound', {
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
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
