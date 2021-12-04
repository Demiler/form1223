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
        const queryFilters = []
        const queryArgs = []
        let argInd = 1;

        const dateFrom = `${data.dt.from.date} ${data.dt.from.time}`
        const dateTo = `${data.dt.to.date} ${data.dt.to.time}`
        if (dateFrom !== dateTo) {
            queryFilters.push('dt BETWEEN SYMMETRIC $1 AND $2')
            queryArgs.push(dateFrom, dateTo)
            argInd = 3;
        }
        else {
            queryFilters.push('dt=$1');
            queryArgs.push(dateFrom);
            argInd = 2;
        }

        queryFilters.push(`mode=$${argInd++}`)
        queryArgs.push(data.mode)

        let conditions = data.conditions;
        if (conditions.condition === "night") {
            let value = '';
            switch (conditions.value) {
                case "min":  value = "min_hv"; break;
                case "mean": value = "avg_hv"; break;
                case "max":  value = "max_hv"; break;
                default: throw 'Unkown conditions value';
            }

            queryFilters.push(`${value} BETWEEN $${argInd++} AND $${argInd++}`);
            queryArgs.push(data.hv2.from, data.hv2.to);
        }
        else {
            queryFilters.push('avg_hv<=128');
        }

        const rangeVariables = { // true means it's cycle var
            latgeo: true,  longeo: true,  latdm:   true, londm: true,
            l:      false, b:      false, max_adc: false
        };

        for (const name in rangeVariables) {
            if (name in data.ranges === false) continue;

            const range = data.ranges[name];
            if (range.from !== null && range.to !== null) {
                if (range.from < range.to) {
                    queryFilters.push(`${name} BETWEEN $${argInd++} AND $${argInd++}`);
                    queryArgs.push(range.from, range.to);
                }
                else if (rangeVariables[name]) {
                    queryFilters.push(`${name} NOT BETWEEN $${argInd++} AND $${argInd++}`);
                    queryArgs.push(range.to, range.from);
                }
            }
            else if (range.from !== null) {
                queryFilters.push(`${name}>=$${argInd++}`);
                queryArgs.push(range.from);
            }
            else if (range.to !== null) {
                queryFilters.push(`${name}<=$${argInd++}`);
                queryArgs.push(range.to);
            }
        }

        return { filters: queryFilters.join(' AND '), args: queryArgs };
    } catch (err) {
        console.log(`Error on parser: ${err}`);
        return "REJECTED";
    }
}

const wrapQueryString = (queryStr, data) => {
    let argInd = queryStr.args.length + 1;

    const head = `SELECT ref FROM ${databaseName} WHERE `;
    const tail = ` ORDER BY dt LIMIT $${argInd++} OFFSET $${argInd++};`;

    const queryFilters = head + queryStr.filters + tail;
    const queryArgs = [...queryStr.args, data.filesLimit, data.filesStart];
    return { filters: queryFilters, args: queryArgs };
}

const wrapCountString = (queryStr) => {
    return {
        filters: `SELECT COUNT(ref) FROM ${databaseName} WHERE ${queryStr.filters}`,
        args: queryStr.args
    };
}

const psqlSearch = async (data, countOnly = false) => {
    console.log("Generating query string...");
    const rawQueryString = generateRawString(data);

    if (rawQueryString === "REJECTED") {
        console.log("Invalid input data. Rejecting...");
        return { status: 3 };
    }

    const countStr = wrapCountString(rawQueryString);
    const reqStr = wrapQueryString(rawQueryString, data);

    console.log("Checking if query exists...");
    if (doneQuerys.has(reqStr.filters)) {
        const query = doneQuerys.get(reqStr.filters);
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
        const res = await countPool.query(countStr.filters, countStr.args);
        countPool.end();
        count = (res.rowCount > 0 ? res.rows[0].count : 0);
        if (count === 0) {
            console.log("Count query was successful but no files were found");
            return { status: 2 };
        }
    }
    catch(err) {
        console.log();
        return { status: 1, err };
    }

    if (countOnly) {
        console.log("Stopping, only the count was asked");
        return { status: 0, id: 'count', count: count };
    }

    console.log("Creating psql pool");
    const psql = new Pool(config.pool);

    try {
        const res = await psql.query(reqStr.filters, reqStr.args);
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
                doneQuerys.delete(reqStr.filters);
            }, queryClearTimeout);

            filesMap.set(id, { errors: new Set(), files: res.rows.map(el => el.ref) });
            doneQuerys.set(reqStr.filters, { timeout, id, count });

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
