var fs = require("fs");

// custom build of PouchDB to meet our SQLite requirements
var PouchDB = require('pouchdb-core')
            .plugin(require('pouchdb-adapter-node-websql'))
            .plugin(require('pouchdb-adapter-http'))
            .plugin(require('pouchdb-replication'));
/*
* Providing direct visibility and access to the PouchDB database through HTTP
*/
module.exports = function routeDatabase(serv) {
    var data_dir = __dirname + "/../db/";
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
};