const completed = new Set();
const callbacks = new Map();
const errorList = new Map();
const deleteTimeout = 10 * 60 * 1000; //10 mins

const callCallback = (token, callback) => {
    const errors = errorList.get(token);
    errorList.delete(token);
    callback(errors);
}

const holdErrors = (token) => {
    errorList.set(token, new Set());
    setTimeout(() => errorList.delete(token), deleteTimeout);
}

const setError = (token, error) => {
    if (!errorList.has(token)) {
        errorList.set(token, new Set());
        setTimeout(() => errorList.delete(token), deleteTimeout);
    }
    errorList.get(token).add(error);
}

const onComplition = (token, callback) => {
    if (completed.has(token)) {
        completed.delete(token);
        callCallback(token, callCallback)
    }
    else if (errorList.has(token)) {
        callbacks.set(token, callback);
        setTimeout(() => callbacks.delete(token), deleteTimeout);
    }
    else
        callback(undefined); //incorrect token
}

const releaseErrors = (token) => {
    if (callbacks.has(token)) {
        const callback = callbacks.get(token);
        callbacks.delete(token);
        callCallback(token, callback);
    }
    else {
        completed.add(token);
        setTimeout(() => completed.delete(token), deleteTimeout);
    }
}

module.exports = { holdErrors, setError, onComplition, releaseErrors };
