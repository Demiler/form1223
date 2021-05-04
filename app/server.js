const { psqlSearch, getFileList, getErrorList, setError } = require('./psqlSearch.js');
const bodyParser = require('body-parser');
const express = require('express')
const tar = require('tar-stream')
const util = require('util')
const path = require('path')
const fs = require('fs')

const DATAPATH = process.env.TUS_DATAPATH;
const PORT = process.argv.length > 2 ? process.argv[2] : 8080;
const app = express();

if (DATAPATH === undefined) {
    console.log("Error: envirment varibale TUS_DATAPATH is not set");
    process.exit(1);
}

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

        res.setHeader('Content-Disposition', 'attachment; filename="whatever.tar"')

        const pack = tar.pack()
        pack.pipe(res)

        const entry = util.promisify(pack.entry).bind(pack)
        let done = 0;

        const checkIfDone = (done, total) => {
            if (done !== total) return;
            console.log(`Archive generated for request with id: ${id}`);
            pack.finalize();
        }

        files.forEach(name => {
            const filepath = DATAPATH + name;
            fs.readFile(filepath, (err, data) => {
                if (err) {
                    const errorMessage = `There is the problem with ${filepath}`;
                    console.log(errorMessage);
                    setError(id, errorMessage);
                    checkIfDone(++done, files.length);
                    return;
                }
                entry({ name }, data);
                checkIfDone(++done, files.length);
            });
        });
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
