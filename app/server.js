const { psqlSearch, getFileList, getErrorList, setError } = require('./psqlSearch.js');
const { config } = require("./loadConfig.js");
const bodyParser = require('body-parser');
const express = require('express')
const tar = require('tar-stream')
const { createGzip } = require('zlib');
const path = require('path')
const fs = require('fs')

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

        const handleError = (e, filepath) => {
            console.log(`There is an error with ${filepath}`);
            setError(id, e);
        }

        const pack = tar.pack()
        pack.pipe(createGzip()).pipe(res)

        for (const i in files) {
            const filepath = DATAPATH + files[i];
            const { size } = await fs.promises.stat(filepath)
                .catch(e => { handleError(e, filepath); return { size: null }; });

            if (size === null) continue;

            const entry = pack.entry({ name: files[i], size });
            await new Promise((response, reject) => {
                fs.createReadStream(filepath)
                    .on('close', response)
                    .on('error', reject)
                    .pipe(entry);
            })
            .then(() => entry.end())
            .catch(e => handleError(e, filepath));
        };

        console.log(`Archive generated for request with an id: ${id}`);
        pack.finalize();
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
