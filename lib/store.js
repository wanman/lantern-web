window.LanternStore = (function() {
    
    var self = {};
    var uri = "http://localhost:8080";

    //--------------------------------------------------------- Local Database
    self.local = new PouchDB("lantern");
    self.local.info()
        .then(function (result) {
            console.log("[main] local database:", result.db_name);
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


    //-------------------------------------------------------- Remote Database
    var opts = {
        skip_setup: true,
        withCredentials: false        
    };
    self.remote = new PouchDB(uri+"/lantern/", opts);
    self.remote.info()
        .then(function (result) {
            console.log("[store] info", result);
            console.log("[store] remote database:", result.db_name);
        });

    self.doc = function() {
        self.local.post({
            title: 'Test Document',
            date: new Date()
        }).then(function (response) {
            console.log(response);
            // handle response
        }).catch(function (err) {
            console.log(err);
        });
    };

    //------------------------------------------------------------------- Sync

    self.sync = function() {
        self.local.sync(self.remote, {
          live: true,
          retry: true
        }).on('change', function (change) {
            console.log("change", change);
            // yo, something changed!
        }).on('paused', function (info) {
            console.log("info", info);
            // replication was paused, usually because of a lost connection
        }).on('active', function (info) {
            console.log("active", info);
            // replication was resumed
        }).on('error', function (err) {
            console.log("error", err);
            // totally unhandled error (shouldn't happen)
        });
    };

    return self;
});