const fs = require('fs')

try {
    console.log("Reading data base config...");
    module.exports.config = JSON.parse(fs.readFileSync('config.json'));
    console.log("ok!");
}
catch (err) {
    console.log(`Config ${err}`);
    process.exit(1);
}
