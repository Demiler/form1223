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

const generateRawString = (data) => {
    try {
        const filesLimit = data.filesLimit;

        const dateFrom = `${data.dt.from.date} ${data.dt.from.time}`
        const dateTo = `${data.dt.to.date} ${data.dt.to.time}`
        let dateString = `dt='${dateFrom}'`;

        if (dateFrom !== dateTo)
            dateString = `dt BETWEEN SYMMETRIC '${dateFrom}' AND '${dateTo}'`

        const opMode = `mode='${data.mode}'`

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

        const cycleVals = new Set([ "latgeo", "longeo", "latdm", "londm" ]);
        const ranges = [];
        for (const name in data.ranges) {
            const range = data.ranges[name];
            if (range.from !== null && range.to !== null) {
                if (range.from < range.to)
                    ranges.push(`${name} BETWEEN ${range.from} AND ${range.to}`);
                else if (cycleVals.has(name))
                    ranges.push(`${name} NOT BETWEEN ${range.to} AND ${range.from}`);
            }
            else if (range.from !== null)
                ranges.push(`${name}>=${range.from}`)
            else if (range.to !== null)
                ranges.push(`${name}<=${range.to}`)
        }

        const args = [ dateString, opMode, conditions, ...ranges ];

        return args.join(" AND ")
    } catch (err) {
        console.log(`Error on parser: ${err}`);
        return "REJECTED";
    }
}

const wrapQueryString = (str, filesLimit) => {
    const head = `SELECT ref FROM ${databaseName} WHERE `;
    const tail = ` ORDER BY dt LIMIT ${filesLimit};`;
    return head + str + tail;
}

const wrapCountString = (str) => {
    return `SELECT COUNT(ref) FROM ${databaseName} WHERE ` + str;
}

const psqlSearch = async (data) => {
    console.log("Generating query string...");
    const rawQueryString = generateRawString(data);
    const countStr = wrapCountString(rawQueryString);
    const reqStr = wrapQueryString(rawQueryString, data.filesLimit);

    if (rawQueryString === "REJECTED") {
        console.log("Invalid input data. Rejecting...");
        return { status: 3 };
    }

    console.log("Checking if query exists...");
    if (doneQuerys.has(reqStr)) {
        const query = doneQuerys.get(reqStr);
        query.timeout.refresh();
        console.log(`Same request already exists. Refreshing id (${query.id})`);
        return { status: 0, id: query.id, count: query.count };
    }
    console.log("It's not. Requesting values from db as:");
    console.log(reqStr);

    console.log("Creating psql count pool");
    let count = 0;
    const countPool = new Pool(config.pool);
    try {
        const res = await countPool.query(countStr);
        countPool.end();
        count = (res.rowCount > 0 ? res.rows[0].count : 0);
        console.log(count);
        if (count === 0) {
            console.log("Count query was successful but no files were found");
            return { status: 2 };
        }
    }
    catch(err) {
        console.log();
        return { status: 1, err };
    }

    console.log("Creating psql pool");
    const psql = new Pool(config.pool);

    try {
        const res = await psql.query(reqStr);
        psql.end();

        if (res.rowCount > 0) {
            console.log(`Success, got ${count} results but saving only ${res.rowCount}`);

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
            doneQuerys.set(reqStr, { timeout, id, count });

            return { status: 0, id, count };
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
