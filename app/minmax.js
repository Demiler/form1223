const { Pool } = require("pg");
const { config } = require("./loadConfig.js");

class MinMax {
    constructor(database) {
        this.dt = {
            from: { date: '2016-05-19', time: '07:31:10'},
            to: { date: '2017-11-30', time: '20:22:37'},
        }

        this.data = new Object();
        this.data.latgeo = { from: null, to: null };
        this.data.longeo = { from: null, to: null };
        //this.data.altgeo = { from: null, to: null };
        this.data.latdm =  { from: null, to: null };
        this.data.londm =  { from: null, to: null };
        //this.data.r =      { from: null, to: null };
        this.data.l =      { from: null, to: null };
        this.data.b =      { from: null, to: null };
        this.data.max_adc ={ from: null, to: null };

        this.database = database;
        this.initReq = true;
    }

    async init() {
        this.initReq = false;

        const minmaxs = [];
        const nonNaNs = [];
        for (const name in this.data) {
            minmaxs.push(`MIN(${name}) from_${name}, MAX(${name}) to_${name}`);
            nonNaNs.push(`${name} != 'NaN'::double precision`);
        }
        const reqStr = 'SELECT ' +
            minmaxs.join(', ') +
            ` FROM ${this.database} WHERE ` +
            nonNaNs.join(' AND ') + ';';

        const psql = new Pool(config.pool);
        const res = await psql.query(reqStr);
        psql.end();

        for (const val in res.rows[0]) {
            const [ range, name ] = val.split(/_(.+)/, 2);
            this.data[name][range] = res.rows[0][val];
        }
        if (this.data.max_adc.from < 0)
            this.data.max_adc.from = 0;
        if (this.data.max_adc.to > 1024)
            this.data.max_adc.to = 1024;
    }

    async send() {
        if (this.initReq) await this.init();

        return JSON.stringify({
            dt: JSON.stringify(this.dt),
            latgeo: this.data.latgeo,
            longeo: this.data.longeo,
            altgeo: this.data.altgeo,
            latdm: this.data.latdm,
            londm: this.data.londm,
            r: this.data.r,
            l: this.data.l,
            b: this.data.b,
            max_adc: this.data.max_adc,
        });
    }
};

module.exports = { MinMax };
