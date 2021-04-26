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

            #HV2 {
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
            dt:      { type: String },
            latgeo:  { type: Object },
            longeo:  { type: Object },
            altgeo:  { type: Object },
            latdm:   { type: Object },
            londm:   { type: Object },
            r:       { type: Object },
            l:       { type: Object },
            b:       { type: Object },
            min_hv:  { type: Number },
            max_hv:  { type: Number },
            avg_hv:  { type: Number },
            mode:    { type: String },
            max_adc: { type: Number },
        };
    }

    constructor() {
        super();
        this.latgeo = { from: 478.002502, to: 1000 };
        this.longeo = { from: null, to: null };
        this.altgeo = { from: null, to: null };
        this.latdm =  { from: null, to: null };
        this.londm =  { from: null, to: null };
        this.r =      { from: null, to: null };
        this.l =      { from: null, to: null };
        this.b =      { from: null, to: null };
    }

    firstUpdated() {
    }

    render() {
        return html`
            <div id="reg-data">
                <div class='title'>Registration date</div>
                <reg-date></reg-date>
            </div>

            <div class='coords' id="geocrd">
                <div class='title'>Geographic Registration Coordinates</div>
                <fromto-input class="latitude"
                    .value=${this.latgeo}>Latitude:</fromto-input>
                <fromto-input class="longitude"
                    .value=${this.longeo}>Longitude:</fromto-input>
                <fromto-input class="altitude"
                    .value=${this.altgeo}>Altitude:</fromto-input>
            </div>

            <div class='coords' id="magcrd">
                <div class='title'>Geomagnetic Event Coordinates</div>
                <fromto-input class="latitude"
                    .value=${this.latdm}>Latitude:</fromto-input>
                <fromto-input class="longitude"
                    .value=${this.londm}>Longitude:</fromto-input>
                <fromto-input class="altitude"
                    .value=${this.r}>R:</fromto-input>
            </div>

            <div id="LBcrd">
                <fromto-input class="lcrd"
                    .value=${this.l}>L-coord:</fromto-input>
                <fromto-input class="bcrd"
                    .value=${this.b}>B-coord:</fromto-input>
            </div>

            <div>
                <div id='op-mode'>
                    <div class='title'>Operating mode</div>
                    <op-mode></op-mode>
                </div>

                <fromto-input class="adc">Analog-to-digital converter:</fromto-input>

            </div>

            <div id='lights'>
                <div class='title'>Lightning conditions</div>
                <light-cnd></light-cnd>
            </div>


            <div id='HV2'>
                <hv2-slider></hv2-slider>
            </div>
        `;
    }

    updateDate(e) {
        console.log(e);
        this.dt = e.detail.value;
    }

    openPicker() {
        this.elements.date.hidden = !this.elements.date.hidden;
    }
};

customElements.define('form-1223', Form1223);
