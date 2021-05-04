const { psqlSearch, getFileList } = require('./psqlSearch.js');
const bodyParser = require('body-parser');
const express = require('express')
const tar = require('tar-stream')
const util = require('util')
const path = require('path')
const fs = require('fs')

const PORT = process.argv.length > 2 ? process.argv[2] : 8080;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'public/')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/', 'index.html'));
});

app.get('/download', async (req, res) => {
    const id = req.query.id;
    console.log('GET get request with an id:', id);

    try {
        const files = getFileList(id);
        if (files === undefined)
            throw "Error: Invalid download url";

        res.setHeader('Content-Disposition', 'attachment; filename="whatever.tar"')

        const pack = tar.pack()
        pack.pipe(res)

        const entry = util.promisify(pack.entry).bind(pack)
        let done = 0;

        files.forEach(name => {
            fs.readFile(name, (err, data) => {
                if (err) {
                    console.log("Couldn't read file ", name);
                    return;
                }
                entry({name}, data);
                if (++done === files.length) {
                    console.log(`Archive generated for request with id: ${id}`);
                    pack.finalize();
                }
            });
        });
    } catch (e) {
        console.error(e);
        res.status(500).end();
    }
});

app.post('/get', async (req, res) => {
    console.log('POST download');
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

app.listen(PORT, () => {
    console.log(`Starting express server on http://localhost:${PORT}`);
});
