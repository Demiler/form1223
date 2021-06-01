import { LitElement, html, css } from 'lit-element'
import { defaultVals } from './default'
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
                --title-width: 225px;
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
                background-color: transparent;

                left: 0px;
                transition: .3s;
                border-radius: 8px;
            }

            #reminder-text.message {
                top: 0;
                background-color: #cfe6ff;
            }

            #reminder-text.error {
                top: 0;
                background-color: #faaeb8;
            }

            #reminder-text[hidden] {
                display: block;
                top: -100px;
            }

            #result {
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
        defaultVals.init(() => {
            defaultVals.set(this);
            this.requestUpdate();
        });
        defaultVals.set(this);

        this.reminderText = "";
    }

    firstUpdated() {
        this.conditions = this.shadowRoot.querySelector("light-cnd").getData();
        this.hv2 = this.shadowRoot.querySelector("hv2-slider").getData();
        this.dt = this.shadowRoot.querySelector("reg-date").getData();

        this.reminderEl = this.shadowRoot.querySelector("#reminder-text");
        this.downloadEl = this.shadowRoot.querySelector("download-button");
        this.disableSlider = (this.conditions.condition === "day");
    }

    render() {
        return html`
            <div id="reg-data">
                <div class='title'>Дата Регистрации</div>
                <reg-date value=${this.dt} @reg-update=${this.updateDateRange}></reg-date>
            </div>

            <div class='coords' id="geocrd">
                <div class='title'>Географические координаты</div>
                <fromto-input class="latitude" @update=${this.updateRange}
                    name="latgeo" .value=${this.latgeo}>Широта:</fromto-input>
                <fromto-input class="longitude" @update=${this.updateRange}
                    name="longeo" .value=${this.longeo}>Долгота:</fromto-input>
            </div>

            <div class='coords' id="magcrd">
                <div class='title'>Геомагнитные координаты</div>
                <fromto-input class="latitude" @update=${this.updateRange}
                    name="latdm" .value=${this.latdm}>Широта:</fromto-input>
                <fromto-input class="longitude" @update=${this.updateRange}
                    name="londm" .value=${this.londm}>Долгота:</fromto-input>
            </div>

            <div id="LBcrd">
                <div class='title'>Координаты МакИлвайна</div>

                <fromto-input class="lcrd" @update=${this.updateRange} .order=${true}
                    name="l" .value=${this.l}>L-коорд:</fromto-input>
                <fromto-input class="bcrd" @update=${this.updateRange} .order=${true}
                    name="b" .value=${this.b}>B-коорд:</fromto-input>
            </div>

            <div id="op-mode">
                <div class='title'>Режим Работы</div>
                <op-mode .value=${this.mode} @update=${this.updateOpMode}></op-mode>

                <fromto-input class="adc" @update=${this.updateRange} .order=${true}
                name="max_adc" .min=${0} .max=${1024} .value=${this.max_adc}
                >Максимальный код АЦП:</fromto-input>

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
                .filesLimit=${this.filesData.limit}
                .filesStart=${this.filesData.start}
                @change=${(e) => this.filesData = e.detail}
                @request=${this.trySend}
                @notfound=${this.notFound}
                @error=${this.reqError}
                @got-count=${this.showGotCount}
                ></download-button>
            </div>

            <div id="reminder">
                <span id="reminder-text" hidden>${this.reminderText}</span>
            </div>
        `;
    }

    showGotCount(e) {
        this.showReminder('message', `Файлов найдено: ${e.detail}`);
    }

    reqError(e) {
        if (e.detail)
            this.showReminder('error', `Ошибка сервера: ${e.detail}`);
        else
            this.showReminder('error', "Ошибка сервера");
    }

    notFound() {
        this.showReminder('error', "По запросу не было найдено записей");
    }

    showReminder(type, text) {
        clearTimeout(this.reminderTO);

        if (this.lastRemType != type)
            this.reminderEl.classList.remove(type);
        this.reminderEl.classList.add(type);
        this.reminderEl.hidden = false;
        this.reminderText = text;

        this.reminderTO = setTimeout(() => {
            this.reminderEl.classList.remove(type);
            this.reminderEl.hidden = true;
        }, 10000);
        this.lastRemType = type;
    }

    trySend(e) {
        const data = JSON.stringify({
            dt: this.dt,
            ranges: {
                latgeo: this.latgeo, longeo: this.longeo, //altgeo: this.altgeo,
                latdm:  this.latdm,  londm:  this.londm,  //r:      this.r,
                l:      this.l,      b:      this.b,
                max_adc: this.max_adc,
            },
            conditions: this.conditions,
            mode: this.mode,
            hv2: this.hv2,
            filesLimit: this.filesData.limit,
            filesStart: this.filesData.start,
        });
        localStorage.setItem('filesData', JSON.stringify(this.filesData));

        if (e.detail === 'download')
            this.downloadEl.download(data);
        else
            this.downloadEl.askCount(data);
    }

    updateIntens(e) {
        this.hv2 = e.detail;
    }

    updateLigCond(e) {
        this.conditions = e.detail;
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
