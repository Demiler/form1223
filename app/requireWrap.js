const requireSafe = (package) => {
    try {
        return require(package);
    }
    catch(err) {
        return undefined;
    }
};
module.exports = { requireSafe };
