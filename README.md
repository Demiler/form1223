## Installation
You can download compiled and archvied version of the form from releases section.
[Link to latest release]: https://github.com/demiler/form1223/releases/latest
Then just untar archvie:
```bash
tar -xf release_vN.tar.gz
```


## Compilation
Instll all dependencies via npm and build the app.
```bash
npm install
npm run build
```
Don't forget to add file `config.json` to app folder. It should look like this:
```json
{
    "port": 8080,
    "schema": "",
    "dbpath": "",
    "pool": {
        "user": "userLogin",
        "host": "localhost",
        "database": "tus",
        "password": "userPassword",
        "port": "5432"
    }
}
```
`port`, `schema` and `dbpath` are optional.
Note that `port` and `dbpath` might be ignored depending on initial conditions.

## Usage
Environment variable `TUS_DATAPATH` should be set to the folder
with data mentioned in the database.

Simply start the server and open `http://localhost:8080` in your browser.
```bash
npm run prod
#or
node app/server.js [port]
```
