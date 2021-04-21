import { LitElement, html, css } from 'lit-element'
import './reg-date'
import './ps-input'
import './light-conditions'
import './operating-mode'
import './hv2-slider'

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

            #geocrd ps-input, #magcrd ps-input {
                margin-bottom: 5px;
            }

            #geocrd ps-input, #magcrd ps-input, #LBcrd ps-input {
                --title-width: 80px;
                --input-width: 80px;
            }


            #magcrd .title {
                text-align: end;
            }
            #magcrd {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }

            #LBcrd {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: 20px;
                grid-column: auto / span 2;
            }

            #LBcrd ps-input.lcrd {
                justify-self: self-start;
            }

            #LBcrd ps-input.bcrd {
                justify-self: self-end;
            }

            #HV2 {
                grid-column: auto / span 2;
            }

            .coord-wrap {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 10px;
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
            latgeo:  { type: Number },
            longeo:  { type: Number },
            altgeo:  { type: Number },
            latdm:   { type: Number },
            londm:   { type: Number },
            r:       { type: Number },
            l:       { type: Number },
            b:       { type: Number },
            min_hv:  { type: Number },
            max_hv:  { type: Number },
            avg_hv:  { type: Number },
            mode:    { type: String },
            max_adc: { type: Number },
        };
    }

    constructor() {
        super();
        this.latgeo = 478.002502;
    }

    firstUpdated() {
    }

    render() {
        return html`
            <reg-date></reg-date>
            <div class='coord-wrap'>
                <div id="geocrd">
                    <div class='title'>Geographic Registration Coordinates</div>
                    <ps-input class="latitude"
                        .value=${this.latgeo}>Latitude:</ps-input>
                    <ps-input class="longitude"
                        .value=${this.longeo}>Longitude:</ps-input>
                    <ps-input class="altitude"
                        .value=${this.altgeo}>Altitude:</ps-input>
                </div>

                <div id="magcrd">
                    <div class='title'>Geomagnetic Event Coordinates</div>
                    <ps-input class="latitude"
                        .value=${this.latdm}>Latitude:</ps-input>
                    <ps-input class="longitude"
                        .value=${this.londm}>Longitude:</ps-input>
                    <ps-input class="altitude"
                        .value=${this.r}>R:</ps-input>
                </div>


                <div id="LBcrd">
                    <ps-input class="lcrd"
                        .value=${this.l}>L-coord:</ps-input>
                    <ps-input class="bcrd"
                        .value=${this.b}>B-coord:</ps-input>
                </div>
            </div>

            <div>
                <div id='op-mode'>
                    <div class='title'>Operating mode</div>
                    <op-mode></op-mode>
                </div>

                <ps-input class="adc">Analog-to-digital converter:</ps-input>

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
