import { LitElement, html, css } from 'lit-element'

class TimePicker extends LitElement {
    static get styles() {
        return css`
            :host {
                position: relative;
            }

            input {
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

            #list {
                position: absolute;
                top: calc(100% + 10px);
                left: 0;
                width: 120px;
                height: 200px;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
                overflow-y: auto;
                background: white;

                box-shadow: 0 0 2px 1px #000000a0;
                border-radius: 2px;
                padding: 5px;
                opacity: 1;
                z-index: 2;
            }

            #list[hidden] {
                opacity: 0;
                z-index: -999;
            }

            .time {
                cursor: pointer;
                padding: 4px;
                text-align: left;
            }

            .time:hover {
                background: #eee;
            }

            ::-webkit-scrollbar {
                background: white;
                height: 8px;
                width: 8px;
            }

            :hover::-webkit-scrollbar-thumb {
                background: #bdc1c6;
            }

            ::-webkit-scrollbar-thumb {
                border: none;
                -webkit-box-shadow: none;
                box-shadow: none;
                background: #dadce0;
                -webkit-border-radius: 8px;
                border-radius: 8px;
                min-height: 40px;
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
        const now = new Date();
        this.hours = now.getHours();
        this.mins = now.getMinutes();
        this.secs = now.getSeconds();
        this.formatValue();

        this.list = [];
        for (let i = 0; i < 24; i++)
            for (let j = 0; j < 60; j += 15)
                this.list.push(i.pad(2) + ':' + j.pad(2));
    }

    firstUpdated() {
        this.inputEl = this.shadowRoot.querySelector("input");
        this.listEl = this.shadowRoot.querySelector("#list");

        if (this.hasAttribute("value"))
            this.setDetTime(this.value);

        this.scrollToBest();
        this.addEventListener('blur', this.change);
    }

    render() {
        return html`
            <input type="text" .value=${this.value}
            @focus=${this.showList}
            @input=${this.removeInvalid}
            @change=${this.change}
            >
            <div id="list" tabindex="-1" hidden>
                ${this.list.map(time => html`
                    <span class='time' @click=${this.determineTime}>${time}</span>
                `)}
            </div>
        `;
    }

    removeInvalid(e) {
        this.value = e.target.value.replace(/[^0-9 :,]+/g, '').replace(/ +/g, ' ');
        this.inputEl.value = this.value;

        let vals = this.value.match(/\d+/g);
        if (vals === null) {
            this.hours = this.mins = this.secs = 0;
            this.hideList();
        }
        else {
            this.showList();
            this.hours = Math.clamp(0, 23, vals[0]);
            this.mins = Math.clamp(0, 59, vals[1]) | 0;
            this.secs = Math.clamp(0, 59, vals[2]) | 0;
            this.scrollToBest();
        }
        this.time = this.hours * 60 * 60 + this.mins * 60 + this.secs;
    }

    scrollToBest() {
        let id = this.hours * 4 + Math.trunc(this.mins / 15);
        this.listEl.children[id].scrollIntoView();
    }

    sendChange() {
        let event = new CustomEvent('time-update', {
            detail: this.getData(),
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    formatValue() {
        this.value = this.hours.pad(2) + ':' + this.mins.pad(2) + ':' + this.secs.pad(2);
        this.time = this.hours * 60 * 60 + this.mins * 60 + this.secs;
    }

    change(e) {
        this.formatValue();
        this.sendChange();
        this.hideList();
        this.inputEl.blur();
    }

    determineTime(e) {
        this.setDetTime(e.target.innerText);
        this.hideList();
    }

    setDetTime(time) { //time = '00:00:00'
        const split = time.split(':');
        this.hours = Number(split[0]);
        this.mins = split.length > 1 ? Number(split[1]) : 0;
        this.secs = split.length > 2 ? Number(split[2]) : 0;
        this.formatValue();
    }

    hideList() {
        this.listEl.hidden = true;
    }

    showList() {
        this.listEl.hidden = false;
    }

    getData() {
        return {
            value: this.value,
            hours: this.hours,
            mins: this.mins,
            secs: this.secs,
            time: this.time
        };
    }
}

customElements.define('time-picker', TimePicker);
