## Installation
Instll all dependencies via npm and build the app.
```bash
npm install
npm run build
```
Don't forget to add file `database.json` to app folder. It should look like this:
```json
{
  "user": "userName",
  "host": "localhost",
  "database": "tus",
  "password": "userPassword",
  "port": "5432"
}
```

## Usage
Environment variable `TUS_DATAPATH` should be set to the folder
with data mentioned in the database.

Simply start the server and open `http://localhost:8080` in your browser.
```bash
npm run prod
#or
node app/server.js [port]
```
