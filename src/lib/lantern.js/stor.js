window.LanternStor = (function($data) {

    var cloud_uri = "http://app.lantern.works/db/lantern";
    var lantern_uri = window.location.origin + "/db/lantern";

    var self = {
        cache: {},        
        browser_db: new PouchDB("lantern"),
        lantern_db: new PouchDB(lantern_uri.replace(":3000", ":8080"), {
            skip_setup: true,
            withCredentials: false        
        }),
        cloud_db: new PouchDB(cloud_uri, {
            skip_setup: true,
            withCredentials: false        
        }),
        cloud_connected: null,
        lantern_connected: null,
        db: null
    };

    //------------------------------------------------------------------------


    function getIndexForDoc(id,type) {
        var doc_id_list = $data[type+"_docs"].map(function(compare_doc) {
            return compare_doc._id;
        });
        var index = doc_id_list.indexOf(id);
        return index;
    }

    function removeFromCache(doc_id) {
        var type = doc_id.split(":")[0];
        var index = getIndexForDoc(doc_id,type);
        //console.log("[stor] remove from cache", doc_id, index);
        $data[type+"_docs"].splice(index, 1);
        self.cache[doc_id] = null;
    }

    function addToCache(doc) {

        var type = doc.id.split(":")[0];
        var obj = doc.toJSONFriendly();
        if (obj._deleted == true) {
            return;
        }
        //console.log("[stor] cache doc:", obj);
        var type_key = type+"_docs";
        if (!$data.hasOwnProperty(type_key)) {
            $data[type_key] = [];
        }
        $data[type_key].push(obj);
        index = getIndexForDoc(doc.id, type);
        self.cache[doc.id] = {
            id: doc.id, 
            type: type,
            index: index
        };
    }

    function replaceInCache(doc) {
        var type = doc.id.split(":")[0];
        var index = getIndexForDoc(doc.id,type);
        //console.log("[stor] replace cache doc:", obj._id, type, index);
        // replace in cache
        var obj = doc.toJSONFriendly();
        $data[type+"_docs"].splice(index, 1, obj);
        self.cache[doc.id].index = index;
    }


    function refreshDocInCache(doc) {
        var type = doc.id.split(":")[0];
        var obj = doc.toJSONFriendly();
        var index;
        // is the document already cached?
        if (self.cache[doc.id]) {
            index = getIndexForDoc(doc.id,type);
            if (obj._deleted) {
                removeFromCache(doc.id);
            }
            else {
                replaceInCache(doc);
            }
        }
        else {
            // insert new to cache
            addToCache(doc);
        }
    }

    function pickDatabase() {
        //console.log("[stor] picking database");
        if (self.db) return Promise.resolve(self.db);

        return new Promise(function(resolve, reject) {

            // fall-back for older devices that might not know how to handle indexDB
            var timer = setTimeout(function() {
                console.log("timed out looking for local db. use remote storage...");
                if (!self.db) {
                    self.db = self.lantern_db;
                    resolve(self.db);
                }
            }, 1000);

            self.browser_db.info()
                .then(function (result) {
                    clearTimeout(timer);
                    self.db = self.browser_db;
                    resolve(self.db);
                }).catch(function(err) {
                    clearTimeout(timer);
                    
                    if (err.status == 500) {
                        if (err.reason == "Failed to open indexedDB, are you in private browsing mode?") {
                            // may be in private browsing mode
                            // attempt in-memory stor
                            // some browsers may not allow us to stor data locally
                            console.log("may be in private browsing mode. using remote storage...");
                            // @todo default to cloud if lanter not available and we have internet
                            self.db = self.lantern_db;
                        }
                        else if (err.reason == "QuotaExceededError") {
                            console.log("quota exceeded for local storage. using remote storage...");
                            self.db = self.lantern_db;
                        }
                        resolve(self.db);
                    }
                    else {
                        clearTimeout(timer);
                        reject(err);
                    }
                });
        });
    }

    /**
    * Slowly backs off and slows down attempts to connect
    */


    //------------------------------------------------------------------------

    self.setup = function() {
        return pickDatabase()
            .then(function() {
                console.log("[stor] target = " + 
                    (self.db.adapter == "http" ? "remote" : "local")
                );
            });
    };

    self.get = function() {
        console.log("[stor] get: " + arguments[0]);
        return self.db.get.apply(self.db, arguments)
            .then(function(data) {
                var doc = new LanternDocument(data, self);
                refreshDocInCache(doc);
                return doc;
            });
    };


    self.getManyByType = function(type) {
        console.log("[stor] loading type: " + type);
        var params = {
            startkey: type+':', 
            endkey: type + ":\ufff0", 
            include_docs: true
        };
        return self.db.allDocs(params)
            .then(function(result) {
                return Promise.all(result.rows.map(function(result) {
                    var doc = new LanternDocument(result.doc, self);
                    refreshDocInCache(doc);
                    return doc;
                }));
            });
    };


    self.remove = function() {
        var doc_id = arguments[0];
        var type = doc_id.split(":")[0];
        console.log("[stor] remove: " + doc_id);
        return self.db.remove.apply(self.db, arguments).then(function(result) {
            removeFromCache(doc_id);
            return result;
        });
    };

    self.removeAll = function() {
        return self.db.allDocs()
            .then(function (result) {
                // Promise isn't supported by all browsers; you may want to use bluebird
                return Promise.all(result.rows.map(function (row) {
                    return self.remove(row.id, row.value.rev);
                }));
            }).then(function () {
                console.log("[stor] finished deleting all docs");
              // done!
            }).catch(function (err) {
                console.log(err);
              // error!
            });
     };

    self.put = function() {
        var doc = arguments[0];
        console.log("[stor] put: ", doc);
        return self.db.put.apply(self.db, arguments).then(function() {
            addToCache(new LanternDocument(doc, self));
        });
    };

    self.upsert = function() {
        //console.log("[stor] upsert " + arguments[0]);
        var fn = arguments[1];
        var obj;

        var wrapper_fn = function(old_doc) {
            obj = fn(old_doc);
            return obj;
        };

        arguments[1] = wrapper_fn;

        return self.db.upsert.apply(self.db, arguments).then(function(results) {
            var new_doc = new LanternDocument(obj);
            new_doc.set("_rev", results.rev);
            refreshDocInCache(new_doc);
            return results;
        });
    };


    self.getCached = function(id) {
        var cached = self.cache[id];
        if (!cached) return;
        return $data[cached.type+"_docs"][cached.index];
    };



    /**
    * Check if we're connected to cloud instance (and therefore internet)
    */
    self.isCloudAvailable = function() {
        return self.cloud_db.info().then(function(results) {
            return true;
        })
        .catch(function() {
            return false;
        });
    };




    /**
    * Check if we're connected to a Lantern device
    */
    self.isLanternAvailable = function() {
        return self.lantern_db.info().then(function(results) {
            return true;
        })
        .catch(function() {
            return false;
        });
    };



    /**
    * Sync our in-browser database with the one on a physical device over wifi
    */
    self.syncWithLantern = function(status_fn) {
        console.log("[stor] trying sync with lantern");
        if (self.db.adapter == "http") {
            console.log("[stor] skipping sync since target is lantern already");
            return;
        }
        LanternSync(self.browser_db, self.lantern_db, "lantern", true, status_fn, function(changed_doc) {
            refreshDocInCache(new LanternDocument(changed_doc, self));
        });
        return;
    };

    /**
    * Sync our in-browser database with the one in the cloud
    */
    self.syncWithCloud = function(status_fn) {
        console.log("[stor] trying sync with cloud");
        LanternSync(self.browser_db, self.cloud_db, "cloud", true, status_fn, function(changed_doc) {
            refreshDocInCache(new LanternDocument(changed_doc, self));

        });
        return;
    };



    return self;
});