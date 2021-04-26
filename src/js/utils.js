const MONTHS =
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


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
   return new Date(Date.parse(mon +" 1, 2000")).getMonth()
}

Math.clamp = (min, max, val) => {
    return Math.min(max, Math.max(min, val));
}

Number.prototype.pad = function(size) {
    let s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}
