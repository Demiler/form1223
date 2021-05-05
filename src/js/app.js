import { LitElement, html, css } from 'lit-element'
import * as utils from './utils'
import './reg-date'
import './light-conditions'
import './operating-mode'
import './hv2-slider'
import './fromto-input'
import './download-button'

class Form1223 extends LitElement {
    static get styles() {
        return css`
            :host {
                display: grid;
                grid-template-columns: 400px 400px;
                grid-gap: 0 20px;
                font-family: sans;
            }

            :host > * {
                margin-bottom: 10px;
            }

            reg-date {
                display: block;
            }

            :host > * {
                border-radius: 5px;
                padding: 5px;
                box-shadow: 2px 2px 5px 2px #00000040;
            }

            .title {
                margin: -5px -5px 5px;
                padding: 5px;
                background: #e6e6e6;
                border-top-left-radius: inherit;
                border-top-right-radius: inherit;
                border-bottom: 1px solid #00000040;
            }

            #HV2 {
                grid-column: auto / span 2;
                position: relative;
            }

            #HV2::after {
                content: ' ';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #ffffffa0;
                border-radius: inherit;
                z-index: 2;
                opacity: 0;
                transition: .2s;
                pointer-events: none;
            }

            #HV2[disabled]::after {
                opacity: 1;
                pointer-events: auto;
                cursor: not-allowed;
            }

            .adc {
                --input-width: 70px;
                --title-width: 190px;
            }

            #reminder {
                grid-row: 5;
                position: relative;
                overflow: hidden;
                box-shadow: none;
            }

            #reminder-text {
                display: block;
                position: absolute;
                padding: 8px;
                background-color: #faaeb8;

                top: 0px;
                left: 0px;
                transition: .3s;
                border-radius: 8px;
            }

            #reminder-text[hidden] {
                top: -100%;
            }

            #result {
                width: 130px;
                grid-column: 2;
                justify-self: flex-end;
                position: relative;
            }
        `;
    }

    static get properties() {
        return {
            reminderText: { type: String },
            disableSlider: { type: Boolean },
        };
    }

    constructor() {
        super();
        this.dt     = { from: null, to: null };
        this.latgeo = { from: null, to: null };
        this.longeo = { from: null, to: null };
        this.altgeo = { from: null, to: null };
        this.latdm =  { from: null, to: null };
        this.londm =  { from: null, to: null };
        this.r =      { from: null, to: null };
        this.l =      { from: null, to: null };
        this.b =      { from: null, to: null };
        this.max_adc ={ from: null, to: null };
        this.mode = "eas";
        this.filesLimit = 10;

        this.reminderText = "";
        this.disableSlider = true;
    }

    firstUpdated() {
        this.conditions = this.shadowRoot.querySelector("light-cnd").getData();
        this.hv2 = this.shadowRoot.querySelector("hv2-slider").getData();
        this.dt = this.shadowRoot.querySelector("reg-date").getData();

        this.reminderEl = this.shadowRoot.querySelector("#reminder-text");
        this.downloadEl = this.shadowRoot.querySelector("download-button");
    }

    render() {
        return html`
            <div id="reg-data">
                <div class='title'>Дата Регистрации</div>
                <reg-date @reg-update=${this.updateDateRange}></reg-date>
            </div>

            <div class='coords' id="geocrd">
                <div class='title'>Координаты Географической Регистрации</div>
                <fromto-input class="latitude" @update=${this.updateRange}
                    name="latgeo" .value=${this.latgeo}>Широта:</fromto-input>
                <fromto-input class="longitude" @update=${this.updateRange}
                    name="longeo" .value=${this.longeo}>Долгота:</fromto-input>
                <fromto-input class="altitude" @update=${this.updateRange}
                    name="altgeo" .value=${this.altgeo}>Высота:</fromto-input>
            </div>

            <div class='coords' id="magcrd">
                <div class='title'>Координаты Геомагнитного События</div>
                <fromto-input class="latitude" @update=${this.updateRange}
                    name="latdm" .value=${this.latdm}>Широта:</fromto-input>
                <fromto-input class="longitude" @update=${this.updateRange}
                    name="londm" .value=${this.londm}>Долгота:</fromto-input>
                <fromto-input class="altitude" @update=${this.updateRange}
                    name="r" .value=${this.r}>R:</fromto-input>
            </div>

            <div id="LBcrd">
                <div class='title'>Геодезические Координаты</div>

                <fromto-input class="lcrd" @update=${this.updateRange}
                    name="l" .value=${this.l}>L-коорд:</fromto-input>
                <fromto-input class="bcrd" @update=${this.updateRange}
                    name="b" .value=${this.b}>B-коорд:</fromto-input>
            </div>

            <div id="op-mode">
                <div class='title'>Режим Работы</div>
                <op-mode .value=${this.mode} @update=${this.updateOpMode}></op-mode>

                <fromto-input class="adc" @update=${this.updateRange}
                name="max_adc" .min=${0} .max=${1024} .value=${this.max_adc}
                >Аналогово-цифровой Преобразователь:</fromto-input>

            </div>

            <div id='lights'>
                <div class='title'>Условия Освещенности</div>
                <light-cnd @update=${this.updateLigCond}></light-cnd>
            </div>


            <div id='HV2' ?disabled=${this.disableSlider}>
                <hv2-slider @update=${this.updateIntens}></hv2-slider>
            </div>

            <div id="result">
                <download-button
                value=${this.filesLimit}
                @change=${(e) => this.filesLimit = e.detail.value}
                @request=${this.trySend}
                @notfound=${this.notFound}
                @error=${this.reqError}
                >Отправить</download-button>
            </div>

            <div id="reminder">
                <span id="reminder-text" hidden>${this.reminderText}</span>
            </div>
        `;
    }

    reqError(e) {
        if (e.detail)
            this.showReminder(`Ошибка сервера: ${e.detail}`);
        else
            this.showReminder("Ошибка сервера");
    }

    notFound() {
        this.showReminder("По запросу не было найдено записей");
    }

    showReminder(text) {
        clearTimeout(this.reminderTO);
        this.reminderText = text;
        this.reminderEl.hidden = false;
        this.reminderTO = setTimeout(() => this.reminderEl.hidden = true, 4000);
    }

    trySend() {
        const data = JSON.stringify({
            dt: this.dt,
            latgeo: this.latgeo, longeo: this.longeo, altgeo: this.altgeo,
            latdm: this.latdm, londm: this.londm, r: this.r,
            l: this.l, b: this.b,
            conditions: this.conditions,
            mode: this.mode,
            max_adc: this.max_adc,
            hv2: this.hv2,
            filesLimit: this.filesLimit,
        });
        this.downloadEl.download(data);
    }

    updateIntens(e) {
        this.hv2 = e.detail;
    }

    updateLigCond(e) {
        this.conditions = e.detail;
        console.log(this.conditions);
        this.disableSlider = (this.conditions.condition === "day");
    }

    updateOpMode(e) {
        this.mode = e.detail.value;
    }

    updateRange(e) {
        const name = e.target.getAttribute("name");
        this[name] = e.detail;
    }

    updateDateRange(e) {
        this.dt.from = e.detail.from;
        this.dt.to = e.detail.to;
    }
};

customElements.define('form-1223', Form1223);
