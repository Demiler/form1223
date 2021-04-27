import { LitElement, html, css } from 'lit-element'

class LightCondition extends LitElement {
    static get styles() {
        return css`
            :host {
                display: block;
                padding: 5px;
                width: 100%;
                box-sizing: border-box;
            }

            :host > div {
            }

            .item {
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

            .item.active {
                background-color: #cfe6ff;
            }

            #day {
                margin-right: 20px;
            }

            #mean {
                margin: 0 20px;
            }

            #daynight {
                margin-bottom: 10px;
            }

            #daynight, #values {
                display: flex;
                width: 100%;
                justify-content: space-between;
                align-items: center;
                transition: .2s;
            }

            #values .item:disabled {
                cursor: not-allowed;
            }
        `;
    }

    static get properties() {
        return {
            now: { type: String },
            value: { type: String },
        };
    }

    constructor() {
        super();
        this.now = "day";
        this.value = "min";
    }

    firstUpdated() {
        this.values = this.shadowRoot.querySelector("#values");
        this.nowEl = { tar: this.shadowRoot.querySelector("#day") }
        this.valEl = { tar: this.shadowRoot.querySelector("#min") }

        this.valBtns = [ this.shadowRoot.querySelector("#min"),
            this.shadowRoot.querySelector("#mean"),
            this.shadowRoot.querySelector("#max"),
        ];
        this.nowEl.tar.classList.add('active');
        this.valEl.tar.classList.add('active');
        this.disableButtons();
    }

    render() {
        return html`
            <div id="daynight">
                <button class='item' id="day" @click=${this.pick}  >Day</button>
                <button class='item' id="night" @click=${this.pick}>Night</button>
            </div>
            <div id="values">
                <button class='item' id="min" @click=${this.pick} >Min</button>
                <button class='item' id="mean" @click=${this.pick}>Mean</button>
                <button class='item' id="max" @click=${this.pick} >Max</button>
            </div>
        `;
    }

    disableButtons() {
        this.valBtns.forEach(button => button.disabled = true);
    }

    enableButtons() {
        this.valBtns.forEach(button => button.disabled = false);
    }


    changeValue(target, newVal) {
        if (this.now === "night") {
            this.value = newVal;
            this.updateTarget(this.valEl, target);
        }
    }

    updateTarget(oldTarget, target) {
        if (oldTarget.tar === target)
            return;

        if (oldTarget.tar)
            oldTarget.tar.classList.remove('active');
        target.classList.add('active');
        oldTarget.tar = target;
    }

    pick(e) {
        switch (e.target.id) {
            case "day":
                this.now = "day";
                this.disableButtons();
                this.updateTarget(this.nowEl, e.target);
                break;
            case "night":
                this.now = "night";
                this.enableButtons();
                this.updateTarget(this.nowEl, e.target);
                break;
            default:
                this.changeValue(e.target, e.target.id);
        }

        let event = new CustomEvent('update', {
            detail: { condition: this.now, value: this.value },
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }
}

customElements.define('light-cnd', LightCondition);
