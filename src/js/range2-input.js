import { LitElement, html, css, unsafeCSS } from 'lit-element'

class Range2Input extends LitElement {
    static get styles() {
        return css`
            :host {
                --thumb-size: 15px;
                --slider-height: 20px;
                --track-height: 6px;

                width: 100%;
                height: var(--slider-height);
                display: grid;
                grid-template-rows: max-content 100%;
                position: relative;
            }

            .track {
                position: absolute;
                width: 100%;
                height: var(--track-height);
                top: calc(50% - var(--track-height) / 2);
                background-color: #d1d1d1;
                z-index: -1;
                border-radius: 100px;
            }

            .slider {
                grid-column: 1;
                grid-row: 2;
                background: none;
                color: #648dff;
                margin: 0;
                padding: 0;
                pointer-events: none;
                -webkit-appearance: none;
            }

            .slider::-webkit-slider-runnable-track {
                -webkit-appearance: none;
            }
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
            }

            .slider::-webkit-slider-runnable-track {
                background: none;
                width: 100%;
                height: 100%;
            }
            .slider::-moz-range-track {
                background: none;
                width: 100%;
                height: 100%;
            }

            .slider::-webkit-slider-thumb {
                background: currentcolor;
                border: none;
                border-radius: 0;
                pointer-events: auto;
                border-radius: 50%;

                width: var(--thumb-size);
                height: var(--thumb-size);
                margin-top: calc((var(--slider-height) - var(--thumb-size)) / 2);
            }
            .slider::-moz-range-thumb {
                background: currentcolor;
                border: none;
                border-radius: 0;
                pointer-events: auto;
                width: 15px;
                height: 15px;
                margin-top: 2px;
                border-radius: 50%;
            }


            .slider:focus, .slider:active {
                outline: none;
            }

            .track.filled {
                background-color: #648dff;
                transform-origin: left;
                transform: scaleX(var(--fill-scale)) translateX(var(--fill-offset));
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
        this.MIN = 0;
        this.MAX = 255;
        this.updateFillParams();
    }

    firstUpdated() {
        if (this.hasAttribute("min"))
            this.MIN = Number(this.getAttribute("min"));

        if (this.hasAttribute("max"))
            this.MAX = Number(this.getAttribute("max"));

        if (this.MIN > this.MAX) {
            const temp = this.MIN;
            this.MIN = this.MAX;
            this.MAX = temp;
        }

        this.WIDTH = this.offsetWidth;
        this.RANGE = this.MAX - this.MIN + 1;
        if (this.from === undefined) this.from = this.MIN;
        if (this.to === undefined)   this.to = this.MAX;
        this.updateFillParams();

        this.fromEl = this.shadowRoot.querySelector("#from");
        this.toEl = this.shadowRoot.querySelector("#to");
        this.addEventListener('mousedown', this.mouseEvent);
    }

    render() {
        return html`
            <div class='track'></div>
            <div class='track filled'
            style="--fill-scale:${this.fillWidth};--fill-offset: ${this.fillOffset}px">
            </div>

            <input type="range" min=${this.MIN} max=${this.MAX}
            id="from" class='slider'
            @input=${this.changeValue}
            .value=${this.from}>

            <input type="range" min=${this.MIN} max=${this.MAX}
            id="to" class='slider'
            @input=${this.changeValue}
            .value=${this.to}>
        `;
    }

    mouseEvent(e) {
        const val = e.offsetX / this.WIDTH * this.RANGE + this.MIN;

        if (Math.abs(this.from - val) < Math.abs(this.to - val))
            this.from = Math.round(val);
        else
            this.to = Math.round(val);

        this.updateFillParams();
        this.sendChange();
    }

    updateFillParams() {
        const diff = Math.abs(this.to - this.from)
        const distFromStart = Math.min(this.from, this.to) - this.MIN;

        this.fillWidth = diff / this.RANGE;
        if (diff === 0)
            this.fillOffset = 0;
        else
            this.fillOffset = distFromStart * this.WIDTH / diff;
    }

    changeValue(e) {
        this[e.target.id] = Number(e.target.value);
        this.updateFillParams();
        this.sendChange();
    }

    sendChange() {
        let event = new CustomEvent('change', {
            detail: this.getData(),
            bubbles: true,
            composed: true });
        this.dispatchEvent(event);
    }

    setData(from, to) {
        this.from = from;
        this.to = to;
        this.updateFillParams();
    }

    getData() {
        return {
            from: Math.min(this.from, this.to),
            to: Math.max(this.from, this.to),
        }
    }
};

customElements.define('range2-input', Range2Input);
