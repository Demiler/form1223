const { config } = require("./loadConfig.js");
const { Pool } = require("pg");
const randstr = require("randomstring");

//////////////////////////////////////////////////////////////////

const filesMap = new Map();
const doneQuerys = new Map();
const queryClearTimeout = 1 * 60 * 60 * 1000; //one hour in millis
const databaseName = (config.schema === '') ? "tus" : `${config.schema}.tus`;

//////////////////////////////////////////////////////////////////
if (config) {//check if connection to db is ok
    console.log("Checking database connection...");
    const psql = new Pool(config.pool);
    psql.query(`SELECT * FROM ${databaseName} LIMIT 0;`)
        .then(() => console.log("ok!"))
        .catch(err => {
            console.log(`PSQL ${err}`)
            process.exit(2);
        });
    psql.end();
}
//////////////////////////////////////////////////////////////////

const generateString = (data) => {
    try {
        const filesLimit = data.filesLimit;
        delete data.filesLimit;

        const dateFrom = `${data.dt.from.date} ${data.dt.from.time}`
        const dateTo = `${data.dt.to.date} ${data.dt.to.time}`
        let dateString = `dt='${dateFrom}'`;

        if (dateFrom !== dateTo)
            dateString = `dt BETWEEN SYMMETRIC '${dateFrom}' AND '${dateTo}'`
        delete data.dt;

        const opMode = `mode='${data.mode}'`
        delete data.mode;

        let conditions = data.conditions;
        if (conditions.condition === "night") {
            switch (conditions.value) {
                case "min":  conditions="min_hv"; break;
                case "mean": conditions="avg_hv"; break;
                case "max":  conditions="max_hv"; break;
            }
            conditions += ` BETWEEN ${data.hv2.from} AND ${data.hv2.to}`;
        }
        else
            conditions = "avg_hv<=128";
        delete data.conditions;
        delete data.hv2;

        const coords = [];
        for (const name in data) {
            const coord = data[name];
            if (coord.from !== null && coord.to !== null)
                coords.push(`${name} BETWEEN ${coord.from} AND ${coord.to}`);
            else if (coord.from !== null)
                coords.push(`${name}>=${coord.from}`)
            else if (coord.to !== null)
                coords.push(`${name}<=${coord.to}`)
        }

        const args = [ dateString, opMode, conditions, ...coords ];
        const begin = `SELECT ref FROM ${databaseName} WHERE `;

        return begin + args.join(" AND ") + ` ORDER BY dt LIMIT ${filesLimit};`;
    } catch (err) {
        console.log(`Error on parser: ${err}`);
        return "REJECTED";
    }
}


const psqlSearch = async (data) => {
    console.log("Generating query string...");
    const reqStr = generateString(data);

    if (reqStr === "REJECTED") {
        console.log("Invalid input data. Rejecting...");
        return { status: 3 };
    }

    console.log("Checking if query exists...");
    if (doneQuerys.has(reqStr)) {
        const query = doneQuerys.get(reqStr);
        query.timeout.refresh();
        console.log(`Same request already exists. Refreshing id (${query.id})`);
        return { status: 0, id: query.id };
    }
    console.log("It's not. Requesting values from db as:");
    console.log(reqStr);

    console.log("Creating psql pool");
    const psql = new Pool(config.pool);

    try {
        const res = await psql.query(reqStr);
        psql.end();

        if (res.rowCount > 0) {
            console.log(`Success, got ${res.rowCount} results`);

            let id = randstr.generate(12);
            while (filesMap.has(id))
                id = randstr.generate(12);

            console.log(`Id generated: ${id}`);

            const timeout = setTimeout(() => {
                console.log(`Deleting long unsued id: ${id}`);
                filesMap.delete(id);
                doneQuerys.delete(reqStr);
            }, queryClearTimeout);

            filesMap.set(id, { errors: new Set(), files: res.rows.map(el => el.ref) });
            doneQuerys.set(reqStr, { timeout, id });

            return { status: 0, id };
        }
        else {
            console.log("Query was successful but no files were found");
            return { status: 2 };
        }
    } catch (err) {
        console.log();
        return { status: 1, err };
    }

    return { status: 3 }; //never should be here but just in case
}

const getFileList = (id) => {
    if (filesMap.has(id))
        return filesMap.get(id).files;
    return undefined;
}

const getErrorList = (id) => {
    if (filesMap.has(id))
        return filesMap.get(id).errors;
    return undefined;
}

const setError = (id, error) => {
    if (filesMap.has(id))
        filesMap.get(id).errors.add(error);
    else
        console.log("setError: incorrect id provided");
}

module.exports = { psqlSearch, getFileList, getErrorList, setError };
