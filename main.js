window.main = (function() {
    var self = {};

    //---------------------------------------------------------- Local Storage
    self.db = new PouchDB("lantern");
    self.db.info().then(function (result) {
            console.log("[main] connected to database:", result.db_name);
        });

    return self;
}());