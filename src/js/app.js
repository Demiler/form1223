import { LitElement, html, css } from 'lit-element'
import './reg-date'
import './ps-input'
import './light-conditions'
import './operating-mode'
import './hv2-slider'
import './fromto-input'

class Form1223 extends LitElement {
    static get styles() {
        return css`
            :host {
                display: grid;
                grid-template-columns: 400px 400px;
                grid-gap: 0 20px;
                /*display: flex;
                flex-wrap: wrap;
                font-size: 14pt;*/

                /*-webkit-column-count: 2;
                -moz-column-count: 2;
                column-count: 2;
                -webkit-column-gap: 25px;
                -moz-column-gap: 25px;
                column-gap: 25px;*/

                width: 800px;
                font-family: sans;
            }

            :host > * {
                margin-bottom: 10px;
                /*width: calc(100% / 1 - 25px / 2);*/
            }

            reg-date {
                display: block;
            }

            /*#geocrd, #magcrd {*/
            :host > * {
                border-radius: 5px;
                padding: 5px;
                box-shadow: 2px 2px 5px 2px #00000040;
            }

            .title {
                text-decoration: underline;
                margin-bottom: 5px;
            }

            #HV2, #result {
                grid-column: auto / span 2;
            }

            .adc {
                --input-width: 70px;
                --title-width: 190px;
            }
        `;
    }

    static get properties() {
        return {
            dt:         { type: Object },
            latgeo:     { type: Object },
            longeo:     { type: Object },
            altgeo:     { type: Object },
            latdm:      { type: Object },
            londm:      { type: Object },
            r:          { type: Object },
            l:          { type: Object },
            b:          { type: Object },
            conditions: { type: Object },
            mode:       { type: String },
            max_adc:    { type: Object },
        };
    }

    constructor() {
        super();
        this.dt     = { from: null, to: null };
        this.latgeo = { from: 478.002502, to: 1000 };
        this.longeo = { from: null, to: null };
        this.altgeo = { from: null, to: null };
        this.latdm =  { from: null, to: null };
        this.londm =  { from: null, to: null };
        this.r =      { from: null, to: null };
        this.l =      { from: null, to: null };
        this.b =      { from: null, to: null };
        this.max_adc ={ from: null, to: null };
    }

    firstUpdated() {
    }

    render() {
        return html`
            <div id="reg-data">
                <div class='title'>Registration date</div>
                <reg-date @reg-update=${this.updateDateRange}></reg-date>
            </div>

            <div class='coords' id="geocrd">
                <div class='title'>Geographic Registration Coordinates</div>
                <fromto-input class="latitude" @update=${this.updateRange}
                    name="latgeo" .value=${this.latgeo}>Latitude:</fromto-input>
                <fromto-input class="longitude" @update=${this.updateRange}
                    name="longeo" .value=${this.longeo}>Longitude:</fromto-input>
                <fromto-input class="altitude" @update=${this.updateRange}
                    name="altgeo" .value=${this.altgeo}>Altitude:</fromto-input>
            </div>

            <div class='coords' id="magcrd">
                <div class='title'>Geomagnetic Event Coordinates</div>
                <fromto-input class="latitude" @update=${this.updateRange}
                    name="latdm" .value=${this.latdm}>Latitude:</fromto-input>
                <fromto-input class="longitude" @update=${this.updateRange}
                    name="londm" .value=${this.londm}>Longitude:</fromto-input>
                <fromto-input class="altitude" @update=${this.updateRange}
                    name="r" .value=${this.r}>R:</fromto-input>
            </div>

            <div id="LBcrd">
                <fromto-input class="lcrd" @update=${this.updateRange}
                    name="l" .value=${this.l}>L-coord:</fromto-input>
                <fromto-input class="bcrd" @update=${this.updateRange}
                    name="b" .value=${this.b}>B-coord:</fromto-input>
            </div>

            <div>
                <div id='op-mode'>
                    <div class='title'>Operating mode</div>
                    <op-mode .value=${this.mode} @update=${this.updateOpMode}></op-mode>
                </div>

                <fromto-input class="adc" @update=${this.updateRange}
                name="max_adc" .min=${0} .max=${1024} .value=${this.max_adc}
                >Analog-to-digital converter:</fromto-input>

            </div>

            <div id='lights'>
                <div class='title'>Lightning conditions</div>
                <light-cnd @update=${this.updateLigCond}></light-cnd>
            </div>


            <div id='HV2'>
                <hv2-slider @update=${this.updateIntens}></hv2-slider>
            </div>

            <div id="result">
                <button id="send-data" @click=${this.trySend}>Send</button>
                <div id="files"></div>
            </div>
        `;
    }

    trySend() {
        const blob = {
            dt: this.dt,
            latgeo: this.latgeo, longeo: this.longeo, altgeo: this.altgeo,
            latdm: this.latdm, londm: this.londm, r: this.r,
            l: this.l, b: this.b,
            conditions: this.conditions,
            code: this.code, J: this.J,
            mode: this.mode,
            max_adc: this.max_adc
        };
        console.log(blob);
    }

    updateIntens(e) {
        this.code = e.detail.code;
        this.J = e.detail.intensity;
    }

    updateLigCond(e) {
        this.conditions = e.detail;
    }

    updateOpMode(e) {
        this.mode = e.detail.value;
    }

    updateRange(e) {
        const name = e.target.getAttribute("name");
        this[name] = e.detail;
        console.log(name, this[name]);
    }

    updateDateRange(e) {
        this.dt.from = e.detail.from;
        this.dt.to = e.detail.to;
    }
};

customElements.define('form-1223', Form1223);
