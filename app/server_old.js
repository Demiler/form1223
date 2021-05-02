const tar = require('tar-stream')
const http = require('http')
const util = require('util')
const fs = require('fs')
const WebSocket = require('ws');
const { Pool, Client } = require("pg");
const randstr = require("randomstring");
const dbconf = require("./database.json");


const HTTP_PORT = 8082;

const filesMap = new Map();

console.log("Creating download server on ", HTTP_PORT);
http.createServer(async (req, res) => {
    try {
        const id = req.url.replace(/^\//, '')
        if (!filesMap.has(id))
            throw "Error: Invalid download url";

        res.setHeader('Content-Disposition', 'attachment; filename="whatever.tar"')

        const pack = tar.pack()
        pack.pipe(res)
        const entry = util.promisify(pack.entry).bind(pack)

        const files = filesMap.get(id);
        await files.forEach(name => {
            fs.readFile(name, (err, data) => {
                if (err) {
                    console.log("Couldn't read file ", name);
                    return;
                }
                entry({name}, data)
            });
        });

        await new Promise(accept => setTimeout(accept, 2000))
        pack.finalize()
    } catch (e) {
        console.error(e)
        res.statusCode = 500
        res.end()
    }
}).listen(HTTP_PORT);

console.log("DataBase config:\n", dbconf);
console.log("Starting server");
const wss = new WebSocket.Server({ port: 8081 });

const generateString = (data) => {
    const dateFrom = `${data.dt.from.date} ${data.dt.from.time}`
    const dateTo = `${data.dt.to.date} ${data.dt.to.time}`
    let dateString = `dt='${dateFrom}'`;

    if (dateFrom !== dateTo)
        dateString = `dt BETWEEN SYMMETRIC '${dateFrom}' AND '${dateTo}'`
    delete data.dt;

    const opMode = `mode='${data.mode}'`
    delete data.mode;

    let conditions = data.conditions;
    if (conditions.condition === "day") {
        switch (conditions.value) {
            case "min":  conditions="min_hv"; break;
            case "mean": conditions="avg_hv"; break;
            case "max":  conditions="max_hv"; break;
        }
        conditions += ` BETWEEN ${data.hv2.from} AND ${data.hv2.to}`;
    }
    else
        conditions = `avg_hv<=128`;
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

    const all = [ dateString, opMode, conditions, ...coords ];

    return "SELECT ref FROM tus WHERE " + all.join(" AND ") + ";";
}


const processRequest = (ws, str) => {
    const data = JSON.parse(str);
    console.log('processing...');

    const filesLimit = data.filesLimit;
    delete data.filesLimit;

    const reqStr = generateString(data);
    console.log("requesting values from dt as:\n", reqStr);

    console.log("Creating psql pool");
    const psql = new Pool(dbconf);

    psql.query(reqStr, (err, res) => {
        if (err) {
            console.log(err);
            return;
        }
        psql.end();

        let id = "";
        if (res.rowCount > 0) {
            console.log("Success, got ", res.rowCount, " results");

            id = randstr.generate(12);
            while (filesMap.has(id))
                id = randstr.generate(12);

            console.log("Id generated ", id);
            filesMap.set(id, res.rows.slice(0, filesLimit).map(el => el.ref));
            console.log(filesMap);
        }
        else
            console.log("Query was successful but no files were found");

        console.log("Sending response to client");
        ws.send(id);

        console.log();
    });
}

wss.on('connection', ws => {
    console.log("Got connection");

    ws.on('message', (data) => {
        console.log('got message from client');
        processRequest(ws, data);
    });
});
