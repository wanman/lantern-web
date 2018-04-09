window.LanternStore = (function() {
    
    var self = {};
    var uri = "http://localhost:8080/db";

    //-------------------------------------------------------- Remote Database
    var opts = {
        skip_setup: true,
        withCredentials: false        
    };
    self.remote = new PouchDB(uri+"/lantern/", opts);
    self.remote.info()
        .then(function (result) {
            console.log("[store] remote info", result);
        });


    // some browsers may not allow us to store data locally
    self.db = self.remote;
    
    //--------------------------------------------------------- Local Database
    self.local = new PouchDB("lantern");
    self.local.info()
        .then(function (result) {
            console.log("[store] local info", result);
            self.db = self.local;
        })
        .catch(function(err) {
            if (err.status == 500) {
                if (err.name == "indexed_db_went_bad") {
                    // may be in private browsing mode
                    // attempt in-memory store
                    return console.log("may be in private browsing mode. refusing to cache data in browser");
                }
            }
            else {
                console.log(err);
            }
        });


    
    self.deleteAll = function() {
        return self.db.allDocs()
            .then(function (result) {
              // Promise isn't supported by all browsers; you may want to use bluebird
              return Promise.all(result.rows.map(function (row) {
                    return self.db.remove(row.id, row.value.rev);
              }));
            }).then(function () {
                console.log("[store] finished deleting all docs");
              // done!
            }).catch(function (err) {
                console.log(err);
              // error!
            });
     };


    //------------------------------------------------------------------- Sync

    self.sync = function() {
        if (!self.local) {
            console.log("[store] skipping sync since no local db");
            return;
        }
        return self.local.sync(self.remote, {
          live: true,
          retry: true
        });
    };

    return self;
});