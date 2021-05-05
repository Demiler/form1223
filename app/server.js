const { psqlSearch, getFileList, getErrorList, setError } = require('./psqlSearch.js');
const { config } = require("./loadConfig.js");
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

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'public/')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/', 'index.html'));
});

app.get('/download', async (req, res) => {
    const id = req.query.id;
    console.log('GET download request with an id:', id);

    try {
        const files = getFileList(id);
        if (files === undefined)
            throw "Error: Invalid download url";
        res.setHeader('Content-Disposition', `attachment; filename="${ARCHNAME}"`)

        const addFileImpl = promisify((name, size, filepath, callback) => {
            const entry = pack.entry({ name, size }, callback)
            fs.createReadStream(filepath)
                .on('error', (e) => console.log(`Piping ${e}`))
                .on('end', () => entry.end())
                .pipe(entry)
        })

        const addFile = async (name, filepath) => {
            const { size } = await fs.promises.stat(filepath)
                .catch(err => {
                    console.log(`Stat ${err}`);
                    setError(id, err);
                    return { size: null };
                });
            if (size !== null)
                await addFileImpl(name, size, filepath)
        }

        const pack = tar.pack()
        const promise = pipe(pack, createGzip(), res)
        for (const i in files) {
            await addFile(files[i], DATAPATH + files[i])
        }
        pack.finalize();
        await promise

        console.log(`Archive generated for request with an id: ${id}`);
        res.end();

    } catch (e) {
        console.error(e);
        res.status(500).end();
    }
});

app.post('/get', async (req, res) => {
    console.log('POST get');
    let search;
    await psqlSearch(req.body).then(res => search = res)
    console.log();

    res.setHeader('Content-Type', 'application/json');
    switch (search.status) {
        case 0:
            res.send(search.id); break;
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

app.get('/errors', (req, res) => {
    const id = req.query.id;
    console.log('GET errors request with an id:', id);
    const errors = getErrorList(id);
    if (errors === undefined) {
        console.log("Incorrect id provided");
        res.status(500).end();
    }
    else {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(Array.from(errors)));
    }
    console.log();
});

app.listen(PORT, () => {
    console.log(`Starting express server on http://localhost:${PORT}`);
});
