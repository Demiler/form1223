export const MONTHS =
    //["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];


export const redispatchEvent = (e) => {
    dispatchEvent(new e.constructor(e.type, e));
}

export const isBlank = (str) => {
    return (!str || /^\s*$/.test(str));
}

export const getCurrentDate = () => {
    const temp = new Date();
    return temp.getDate() + " " + MONTHS[temp.getMonth()] + " " + temp.getFullYear();
}

export const stringToDate = (str, sep = '-') => {
    const arr = str.split(sep);
    return arr[0] + " " + MONTHS[Number(arr[1]) - 1] + " " + arr[1];
}

export const isValidDate = (d) => {
    return d instanceof Date && !isNaN(d);
}

export const getMonthFromString = (mon) => {
    if (mon === undefined || mon === null) return -1;
    mon = mon.toLowerCase().slice(0, 3);
    return MONTHS.indexOf(mon);
    //return new Date(Date.parse(mon +" 1, 2000")).getMonth()
}

export const isObjectType = (value) => {
    return value != null && typeof value == 'object' && !Array.isArray(value);
}

export const isObjectEmpty = (obj) => {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

export const isObjectFilled = (obj) => {
    for (let key in obj) {
        if (isObjectType(obj[key])) {
            const ret = isObjectFilled(obj[key]);
            if (ret !== undefined)
                return [ key, ...ret ];
        }
        else if (obj[key] === undefined || obj[key] === null || obj[key] === "")
            return [ key ];
    }
    return undefined;
}


Math.clamp = (min, max, val) => {
    return Math.min(max, Math.max(min, val));
}

Number.prototype.pad = function(size) {
    let s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}
