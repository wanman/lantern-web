var express = require("express");
var fs = require("fs");
var path = require("path");
var execSync = require("child_process").execSync;
var cors = require("./lib/cors-middleware");
var rewrite = require("./lib/rewrite-middleware");
var captive = require("./lib/captive-middleware");

var PouchDB, db, serv, port;

//----------------------------------------------------------------------------
/*
* Set up database server
*/
// custom build of PouchDB to meet our SQLite requirements
PouchDB = require('pouchdb-core')
            .plugin(require('pouchdb-adapter-node-websql'))
            .plugin(require('pouchdb-adapter-http'))
            .plugin(require('pouchdb-replication'));

db = new PouchDB("http://localhost/db/lantern");



//----------------------------------------------------------------------------

/*
* Providing direct visibility and access to the PouchDB database through HTTP
*/
function routeDatabase() {
    var data_dir = __dirname + "/db/";
    if (!fs.existsSync(data_dir)) {
        fs.mkdirSync(data_dir);
    }
    var db_router = require("express-pouchdb")(PouchDB.defaults({
        prefix: data_dir,
        adapter: "websql"
    }), {
        configPath: "./db/db-conf.json",
        logPath: "./db/db-log.txt"
    });
    serv.use("/db/", db_router);
}

/*
* Serves the web application / user interface, which may be updated over time
*/
function routeStatic() {
    var static_path = path.resolve(__dirname + "/public/");
    serv.use("/", express.static(static_path));
}


//----------------------------------------------------------------------------
/*
* Set up application server and routing
*/
serv = express();
serv.disable("x-powered-by");
serv.use(rewrite);
serv.use(cors);
routeDatabase();
serv.use(captive);
routeStatic();

// start up server
port = (process.env.TERM_PROGRAM ? 8080 : 80);
serv.listen(port, function() {
    console.log("[server] ready on port %s ...", port);
    db.info()
        .then(function(response) {
            console.log("[server] database starting doc count: " + response.doc_count);
            console.log("[server] database update sequence: " + response.update_seq);
    })
    .catch(function(err) {
        console.log(err);
        throw new Error(err);
    });
});