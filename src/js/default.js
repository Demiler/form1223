class DefaultValues {
    constructor() {
        this.dt     =
            { from: { date: "2016-05-19", time: "07:31:10" },
                to: { date: "2017-11-30", time: "20:22:37" }};
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
        this.filesData = { limit: 1000, start: 0 };
    }

    init(callback) {
        if (localStorage.getItem('clear') !== null)
            localStorage.clear();

        if (localStorage.getItem('dt') !== null) {
            //this.dt      = JSON.parse(localStorage.getItem('dt'));
            this.latgeo  = JSON.parse(localStorage.getItem('latgeo'));
            this.longeo  = JSON.parse(localStorage.getItem('longeo'));
            //this.altgeo  = JSON.parse(localStorage.getItem('altgeo'));
            this.latdm   = JSON.parse(localStorage.getItem('latdm'));
            this.londm   = JSON.parse(localStorage.getItem('londm'));
            //this.r       = JSON.parse(localStorage.getItem('r'));
            this.l       = JSON.parse(localStorage.getItem('l'));
            this.b       = JSON.parse(localStorage.getItem('b'));
            this.max_adc = JSON.parse(localStorage.getItem('max_adc'));
            if (localStorage.getItem('filesData') !== null) {
                this.filesData = JSON.parse(localStorage.getItem('filesData'));
            }
        }
        else
            this.fetchVals(callback);
    }

    set(obj) {
        obj.dt      = this.dt;
        obj.latgeo  = this.latgeo;
        obj.longeo  = this.longeo;
        //obj.altgeo  = this.altgeo;
        obj.latdm   = this.latdm;
        obj.londm   = this.londm;
        //obj.r       = this.r;
        obj.l       = this.l;
        obj.b       = this.b;
        obj.max_adc = this.max_adc;
        obj.mode    = this.mode;
        obj.filesData = this.filesData;
    }

    fetchVals(callback) {
        fetch(`${window.location.href}default`, {
            headers: { 'Accept': 'application/json' },
        })
        .then(async res => {
            if (res.status === 200) {
                const data = await res.json();

                this.dt = JSON.parse(data.dt);
                localStorage.setItem('dt', data.dt);
                delete data.dt;

                for (const name in data) {
                    if (data[name].from !== undefined && data[name].to !== undefined) {
                        data[name].from = Math.round(data[name].from);
                        data[name].to = Math.round(data[name].to);
                    }
                    localStorage.setItem(name, JSON.stringify(data[name]));
                    this[name] = data[name];
                }
            }
            callback();
        })
    }
};

export const defaultVals = new DefaultValues();
