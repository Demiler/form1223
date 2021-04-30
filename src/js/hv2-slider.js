import { LitElement, html, css } from 'lit-element'
import './range2-input'

class HV2Slider extends LitElement {
    static get styles() {
        return css`
            :host {
                display: grid;
                grid-template-columns: 1fr 160px;
                grid-gap: 10px;
                justify-content: space-between;
            }

            .preview-wrap {
                display: flex;
                width: 100%;
                justify-content: space-evenly;
                align-items: center;
                font-size: 13px;
            }

            .preview {
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
            }

            #input-from .preview-element {
                border-right: 1px solid black;
            }

            .preview-element {
                padding: 2px 8px;
                border: none;
                border-bottom: 1px solid black;
                box-sizing: border-box;
                outline: none;
                transition: .2s;

                width: 100%;
                margin: 0;
                -moz-appearance: textfield;
            }

            .preview-element::-webkit-outer-spin-button,
            .preview-element::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }

            .preview-element:focus {
                background-color: #eee;
                border-color: #87c1ff;
            }

            .preview .label {
                font-size: 10px;
                padding: 0 8px;
                margin-bottom: 5px;
                color: #555;
            }

            #slider {
                height: 60px;
                position: relative;
                display: flex;
                align-items: center;
                width: 100%;
            }

            #range {
                width: 100%;
                height: 20px;
                z-index: 1;
            }

            .ticks {
                position: absolute;
                display: flex;
                width: 100%;
                height: 100%;
                font-size: 10pt;
            }

            .tick {
                /*width: 80px;*/
                width: 100%;

                text-align: center;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                position: relative;
                user-select: none;

                pointer-events: none;
            }

            .tick .holder {
                pointer-events: none;
                position: absolute;
                width: 2px;
                height: 40%;
                top: 30%;
                left: calc(50% - 1px);
                background: black;
            }

            .tick:first-child .holder, .tick:last-child .holder {
                display: none;
            }

            .tick:first-child {
                text-align: left;
            }

            .tick:last-child {
                text-align: right;
            }

            .tick:before {
            }
        `;
    }

    static get properties() {
        return {
            from: { type: Number },
            to: { type: Number },
        };
    }

    constructor() {
        super();
        this.MIN = 128;
        this.MAX = 255;
        this.MINJ = this.codeToIntensity(this.MIN);
        this.MAXJ = this.codeToIntensity(this.MAX);

        this.from = this.MIN;
        this.to = this.MAX;
        this.fromJ = this.codeToIntensity(this.from);
        this.toJ = this.codeToIntensity(this.to);

        this.ticks = [];
        this.minTickWidth = 64;
        this.maxTickWidth = 128;
    }

    firstUpdated() {
        let width = this.shadowRoot.querySelector("#slider").offsetWidth;
        this.fullRecalc(width);

        this.sliderEl = this.shadowRoot.querySelector("range2-input");
        this.inputFromEl = this.shadowRoot.querySelector("#input-from input");
        this.inputToEl = this.shadowRoot.querySelector("#input-to input");
    }

    fullRecalc(width) {
        let tickWidth = this.minTickWidth;
        let lowestMod = this.maxTickWidth;
        for (let i = this.minTickWidth; i < this.maxTickWidth; i++) {
            let mod = width % i;
            if (mod < lowestMod) {
                tickWidth = i;
                lowestMod = mod;
            }
            if (mod === 0)
                break;
        }
        this.tickWidth = tickWidth;

        const valsCnt = this.MAX - this.MIN + 1;

        let step = Math.floor(tickWidth * valsCnt / width) + 1;
        let ticksCount = Math.round(width / tickWidth);
        //let initialStep = Math.trunc((valsCnt / width) * (tickWidth / 2)) - 1;

        this.recalculate(step, ticksCount, 5); //magic number is currection number
    }

    recalculate(step, ticksCount, initialStep) {
        this.ticks = [];
        this.ticks.push(this.MIN);
        for (let i = 1; i < ticksCount - 1; i++) {
            let code = Math.trunc(i * step + this.MIN + initialStep);
            this.ticks.push(code);
        }
        this.ticks.push(this.MAX);
        this.requestUpdate();
    }

    render() {
        return html`
            <div id='slider'>
                <range2-input id="range"
                min="128" max="255"
                @change=${this.changeValue}
                ></range2-input>

                <div class='ticks'>
                    ${this.ticks.map(code => html`
                        <div class='tick' style="width:${this.tickWidth}px">
                            <span class='codeVal'>${code}</span>
                            <span class='holder'></span>
                            <span class='intsVal'>${this.codeToIntensity(code)}</span>
                        </div>
                    `)}
                </div>
            </div>

            <div class='preview-wrap'>
                <div id="input-from" class='preview'>
                    <span class='label'>От</span>
                    <input class='preview-element code' type="number"
                    @input=${this.changeCode}
                    @change=${this.changeCode}
                    value=${this.from}>
                    <div class='preview-element intensity'>${this.fromJ}</div>
                </div>
                <div id="input-to" class='preview'>
                    <span class='label'>До</span>
                    <input class='preview-element code' type="number"
                    @input=${this.changeCode}
                    @change=${this.changeCode}
                    value=${this.to}>
                    <div class='preview-element intensity'>${this.toJ}</div>
                </div>
            </div>
        `;
    }

    codeToIntensity(code) {
        const intensity = 3 * Math.pow(10, 7) * Math.pow((255 / code), 6);
        return Number.parseFloat(intensity).toExponential(2);
    }

    changeCode(e) {
        let val = Number(e.target.value);
        if (e.target.parentNode.id === "input-from") {
            val = this.from = Math.clamp(this.MIN, this.to, val);
            this.fromJ = this.codeToIntensity(this.from);
        }
        else {
            val = this.to = Math.clamp(this.from, this.MAX, val);
            this.toJ = this.codeToIntensity(this.to);
        }

        if (e.type === "change") {
            e.target.value = val;
            e.target.blur();
        }

        this.sliderEl.setData(this.from, this.to);

        this.sendChange();
    }

    changeValue(e) {
        this.from = e.detail.from;
        this.to = e.detail.to;
        this.fromJ = this.codeToIntensity(this.from);
        this.toJ = this.codeToIntensity(this.to);
        this.inputFromEl.value = this.from;
        this.inputToEl.value = this.to;
        this.sendChange()
    }

    sendChange() {
        let event = new CustomEvent('update', {
            detail: this.getData(),
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }

    getData() {
        return {
            from: this.from,
            to: this.to
        };
    }
}

customElements.define('hv2-slider', HV2Slider);
