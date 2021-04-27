import { LitElement, html, css } from 'lit-element'

class HV2Slider extends LitElement {
    static get styles() {
        return css`
            :host {
                display: flex;
                justify-content: space-between;
            }

            .preview {
                padding: 2px 8px;
                border: none;
                border-bottom: 1px solid black;
                width: auto;
            }

            #slider {
                height: 60px;
                position: relative;
                display: flex;
                align-items: center;
                width: calc(100% - 90px);
            }

            .preview-wrap {
                display: flex;
                flex-direction: column;
                width: 80px;
                justify-content: space-evenly;
            }

            #slider input {
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

            input {
                width: 100%;
                margin: 0;
            }

            .preview {
                display: inline-block;
            }
        `;
    }

    static get properties() {
        return {
            code: { type: Number },
            intensity: { type: Number },
        };
    }

    constructor() {
        super();
        this.MIN = 128;
        this.MAX = 255;
        this.code = this.MIN;
        this.intensity = this.codeToIntensity(this.code);
        this.ticks = [];
        this.minTickWidth = 70;
        this.maxTickWidth = 100;
    }

    firstUpdated() {
        let width = this.shadowRoot.querySelector("#slider").offsetWidth;
        this.fullRecalc(width);
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

        this.recalculate(step, ticksCount, 9); //9 - for 720px
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
                <input type="range" min=${this.MIN} max=${this.MAX}
                    @input=${this.changeValue} .value=${this.code}>
                <div class='ticks'>
                    ${this.ticks.map(code => html`
                        <div class='tick' style="width:${this.tickWidth}px">
                            <span class='holder'></span>
                            <span class='codeVal'>${code}</span>
                            <span class='intsVal'>${this.codeToIntensity(code)}</span>
                        </div>
                    `)}
                </div>


            </div>
            <div class='preview-wrap'>
                <input class='preview' id="code" .value=${this.code}>
                <input class='preview' id="intensity" .value=${this.intensity}>
            </div>
        `;
    }

    codeToIntensity(code) {
        let intensity = 3 * Math.pow(10, 7) * Math.pow((255 / code), 6);
        return Number.parseFloat(intensity).toExponential(2);
    }

    changeValue(e) {
        this.code = Number(e.target.value);
        this.intensity = this.codeToIntensity(this.code);
        this.sendChange()
    }

    sendChange() {
        let event = new CustomEvent('update', {
            detail: { code: this.code, intensity: this.intensity },
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }
}

customElements.define('hv2-slider', HV2Slider);
