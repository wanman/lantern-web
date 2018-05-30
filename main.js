/**
* Lantern HTTP Server
*
* We serve web applications and the PouchDB at the same origin.
* This allows easy access to the database through javascript.
* Useful for hosting on a Raspberry Pi or cloud environment.
*
**/

var express = require("express");
var path = require("path");
var fs = require("fs");

// custom build of PouchDB to meet our SQLite requirements
var PouchDB = require('pouchdb-core')
            .plugin(require('pouchdb-adapter-http'));

var db, serv, port;

//----------------------------------------------------------------------------

/*
* Set up application server and routing
*/
serv = express();
serv.disable("x-powered-by");

/*
* Auto-load middleware
*/
fs.readdir("./middleware", function(err, files)  {
    files.forEach(function(file)  {
        serv.use(require("./middleware/" + file));
    });
});

/*
* Auto-load routes
*/
fs.readdir("./routes", function(err, files) {
    files.forEach(function(file) {
        require("./routes/" + file)(serv);
    });
});

/*
* Check for additional routes (e.g. device-specific controls)
*/
fs.readdir("../../routes", function(err, files) {
    if (!err) {
        files.forEach(function(file) {
            require("../../routes/" + file)(serv);
        });   
    }
});

/*
* Final routes are for any static pages and binary files
*/
var static_path = path.resolve(__dirname + "/public/");
serv.use("/", express.static(static_path));

/*
* Start web server
*/
port = (process.env.TERM_PROGRAM ? 8080 : 80);
serv.listen(port, function() {
    console.log("[server] ready on port %s ...", port);

    /*
    * Set up lantern database bucket
    */
    db = new PouchDB("http://localhost/db/lantern");
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