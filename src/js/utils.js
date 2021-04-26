export const redispatchEvent = (e) => {
    dispatchEvent(new e.constructor(e.type, e));
}

export const isBlank = (str) => {
    return (!str || /^\s*$/.test(str));
}
