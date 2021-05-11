const { psqlSearch, getFileList, getErrorList, setError } = require('./psqlSearch.js');
const { config } = require("./loadConfig.js");
const { MinMax } = require("./minmax.js");
const errors = require('./errors.js');
const bodyParser = require('body-parser');
const express = require('express')
const tar = require('tar-stream')
const { createGzip } = require('zlib');
const path = require('path')
const fs = require('fs')
const { pipeline } = require('stream')
const { promisify } = require('util')
const pipe = promisify(pipeline)

////////////////////////////////////////////////////////////
const ARCHNAME = "pribor_tus_sputnik_lomonosov.tar.gz";
let DATAPATH = (() => {
    if (process.env.TUS_DATAPATH)
        return process.env.TUS_DATAPATH;
    if (config.dbpath !== '')
        return config.dbpath;
    return undefined;
})();

const PORT = (() => {
    if (process.argv.length > 2)
        return process.argv[2];
    else if (config.port)
        return config.port;
    return 8080;
})();

if (DATAPATH === undefined) {
    console.log("Error: path to the database is not set");
    process.exit(1);
}
////////////////////////////////////////////////////////////

const databaseName = (config.schema === '') ? "tus" : `${config.schema}.tus`;
const defaultVals = new MinMax(databaseName);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'public/')));

app.get('/', (req, res) => {
    console.log(`[${new Date().toLocaleString().replace(',','')}] GET /`);
    res.sendFile(path.resolve(__dirname, 'public/', 'index.html'));
});

app.get('/download', async (req, res) => {
    const id = req.query.id;
    const token = req.query.token;
    console.log(`[${new Date().toLocaleString().replace(',','')}] GET download request with an id - ${id} and token - ${token}`);

    if (token === '' || token === undefined) {
        console.log("Error: Invalid token");
        res.status(400).end();
        return;
    }

    const files = getFileList(id);
    if (files === undefined) {
        console.log("Error: Invalid download url");
        res.status(400).end();
        return;
    }

    try {
        res.setHeader('Content-Disposition', `attachment; filename="${ARCHNAME}"`)

        const addFileImpl = promisify((name, size, filepath, callback) => {
            const entry = pack.entry({ name, size }, callback)
            fs.createReadStream(filepath)
                .on('end', () => entry.end())
                .on('error', (e) => {
                    console.log(`Piping ${e}`)
                    errors.setError(token, `Unabled to pipe ${name}: ${e}`);
                })
                .pipe(entry)
        })

        const addFile = async (name, filepath) => {
            const { size } = await fs.promises.stat(filepath)
                .catch(err => {
                    console.log(`Stat ${err}`);
                    errors.setError(token, `File ${name} is inaccessible`);
                    return { size: null };
                });
            if (size !== null)
                await addFileImpl(name, size, filepath)
        }

        errors.holdErrors(token);
        const pack = tar.pack()
        const promise = pipe(pack, createGzip(), res)
        for (const i in files) {
            await addFile(files[i], DATAPATH + files[i])
        }
        pack.finalize();
        await promise

        console.log(`Archive generated for request with an id: ${id}`);
        res.end();
        errors.releaseErrors(token);

    } catch (e) {
        console.error(e);
        res.status(500).end();
    }
});

app.post('/get', async (req, res) => {
    console.log(`[${new Date().toLocaleString().replace(',','')}] POST /get`);
    const search = await psqlSearch(req.body);
    console.log();

    res.setHeader('Content-Type', 'application/json');
    switch (search.status) {
        case 0:
            const id = search.id;
            res.send(JSON.stringify({ id, count: getFileList(id).length })); break;
        case 1:
            console.log(`Error in search: ${search.err}`);
            res.status(500).end(); break;
        case 2:
            res.status(404).end(); break;
        case 3: //invalid data rejection
            res.status(400).end(); break;
        default:
            console.log("Unkown status from psqlSearch: ", search.status);
            res.status(500).end(); break;
    }
});

app.get('/default', async (req, res) => {
    console.log(`[${new Date().toLocaleString().replace(',','')}] GET /default`);
    res.send(await defaultVals.send());
});

app.get('/errors', async (req, res) => {
    console.log(`[${new Date().toLocaleString().replace(',','')}] GET errors request with a token: ${req.query.token}`);

    errors.onComplition(req.query.token, (errList) => {
        if (errList === undefined) {
            console.log("Incorrect token provided");
            res.status(500).end();
        }
        else {
            console.log('Responding to token:', req.query.token);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(Array.from(errList)));
        }
        console.log();
    });
});

app.listen(PORT, () => {
    console.log(`Starting express server on port ${PORT}`);
});
