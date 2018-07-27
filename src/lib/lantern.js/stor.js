window.LanternStor = (function($data, uri) {

    var cloud_uri = "https://lantern.global/db/lantern/";
    var did_sync_maps = false;
    uri = uri.replace(":3000", "");

    var self = {
        doc_cache: {},
        type_cache: {},  
        browser_db: null,
        lantern_db: new PouchDB(uri + "/db/lantern/", {
            skip_setup: true,
            withCredentials: false        
        }),
        lantern_maps_db: new PouchDB( uri + "/db/lantern-maps/", {
            skip_setup: true,
            withCredentials: false        
        }),
        cloud_db: new PouchDB(cloud_uri, {
            skip_setup: true,
            withCredentials: false        
        }),
        cloud_connected: null,
        lantern_connected: null,
        lantern_uri: uri,
        db: null
    };

    try {
        self.browser_db = new PouchDB("lantern");
    }
    catch(e) {
        // browser refuses to use local storage...
        console.log("[stor] skip in-browser storage since browser refuses");
    }

    //------------------------------------------------------------------------


    function getIndexForDoc(id,type) {
        if (!$data[type+"_docs"]) return;

        var doc_id_list = $data[type+"_docs"].map(function(compare_doc) {
            return compare_doc._id;
        });
        var index = doc_id_list.indexOf(id);
        return index;
    }

    function removeFromCache(doc_id) {
        var type = doc_id.split(":")[0];
        var index = getIndexForDoc(doc_id,type);
        if (!index) return;
        //console.log("[stor] remove from cache", doc_id, index);
        $data[type+"_docs"].splice(index, 1);
        self.doc_cache[doc_id] = null;
        if (self.type_cache[type] && self.type_cache[type][doc_id]);
        delete self.type_cache[type][doc_id];
    }

    function addToCache(doc) {
        var index;

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

        // make sure we don't double-add to cache
        index = getIndexForDoc(doc.id, type);
        if (index != -1) {
            // console.log("[stor] found existing index for " + doc.id, index);
        }
        else {
            $data[type_key].push(obj);
            index = getIndexForDoc(doc.id, type);
            self.doc_cache[doc.id] = {
                id: doc.id, 
                type: type,
                index: index
            };

            self.type_cache[type] = self.type_cache[type] || {};
            self.type_cache[type][doc.id] = doc;
        }
    }

    function replaceInCache(doc) {
        var type = doc.id.split(":")[0];
        var index = getIndexForDoc(doc.id,type);
        // replace in cache
        var obj = doc.toJSONFriendly();


        //console.log("[stor] replace cache doc:", obj._id, type, index);

        $data[type+"_docs"].splice(index, 1, obj);
        self.doc_cache[doc.id].index = index;


        self.type_cache[type] = self.type_cache[type] || {};
        self.type_cache[type][doc.id] = doc;
    }


    function refreshDocInCache(doc) {
        var type = doc.id.split(":")[0];
        var index;

        // is the document already cached?
        if (self.doc_cache[doc.id]) {
            index = getIndexForDoc(doc.id,type);
            if (doc.data._deleted) {
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

    function lanternOrCloud() {
        return self.cloud_db.info().then(function() {
            self.db = self.cloud_db;
            self.cloud_connected = true;
            return self.db;
        })
        .catch(function() {
            return self.lantern_db.info().then(function() {
                self.db = self.lantern_db;
                self.lantern_connected = true;
                return self.db;
            });
        });
    }

    function pickDatabase() {
        //console.log("[stor] picking database");
        if (self.db) return Promise.resolve(self.db);

        return new Promise(function(resolve, reject) {

            // fall-back for older devices that might not know how to handle indexDB
            var timer = setTimeout(function() {
                console.log("timed out looking for local db. use remote storage...");
                if (!self.db) {
                    return lanternOrCloud();
                }
            }, 1000);

            if (!self.browser_db) {
                return lanternOrCloud().then(resolve);
            }

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
                            lanternOrCloud().then(resolve);
                        }
                        else if (err.reason == "QuotaExceededError") {
                            console.log(err);
                            console.log("quota exceeded for local storage. using remote storage...");
                            lanternOrCloud().then(resolve);
                        }
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
            .then(function(db) {
                console.log("[stor] using database:", db.name);
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

    self.print = function(id) {
        return self.get(id).then(function(res) {
            console.log(res.toJSONFriendly());
        });
    };

    self.getManyByType = function(type) {
        var params = {
            startkey: type+':', 
            endkey: type + ":\ufff0", 
            include_docs: true
        };
        return self.db.allDocs(params)
            .then(function(result) {

               console.log("[stor] loading type: " + type + " (" + result.rows.length + ")");

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
        return self.db.put.apply(self.db, arguments).then(function(results) {
            refreshDocInCache(new LanternDocument(doc, self));
            return results;
        });
    };

    self.post = function() {
        var doc = arguments[0];
        console.log("[stor] post: ", doc);
        return self.db.put.apply(self.db, arguments).then(function(results) {
            if (results.rev) { 
                doc._rev = results.rev;
            }
            refreshDocInCache(new LanternDocument(doc, self));
            return results;
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
        var cached = self.doc_cache[id];
        if (!cached) return;
        return $data[cached.type+"_docs"][cached.index];
    };


    /**
    * Compact database
    */
    self.compact = function() {
        if (self.browser_db) {
            self.browser_db.compact();
        }

        return self.db.compact().then(function (info) {
            // compaction complete
            console.log("[stor] compaction complete", info);
        }).catch(function (err) {
            // handle errors
            console.error(err);
        });
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
    self.syncWithLantern = function(continuous, status_fn, change_fn) {
        //console.log("[stor] trying sync with lantern");
        if (self.db.adapter == "http") {
            console.log("[stor] skipping sync since target is lantern already");
            status_fn(true);
            return;
        }

        
        LanternSync(self.browser_db, self.lantern_db, "lantern", continuous, function(status) {
                status_fn(status);

                // don't bother trying map sync until main sync is working...
                if (status && !did_sync_maps) {
                    did_sync_maps = true;


                    try {
                        var local_maps_db = new PouchDB("lantern-maps");

                        LanternSync(local_maps_db, self.lantern_maps_db, "lantern-maps", continuous, function() {}, function(changed_doc) {
                            //console.log("[stor] map update", changed_doc._id);
                        });
                    }
                    catch(e) {
                        // browser refuses to use local storage...
                        console.log("[stor] skip map sync since no in-browser storage available");
                    }

                }

            }, function(changed_doc) {
            refreshDocInCache(new LanternDocument(changed_doc, self));
            change_fn(changed_doc);
        });



        return;
    };

    /**
    * Sync our in-browser database with the one in the cloud
    */
    self.syncWithCloud = function(continuous, status_fn, change_fn) {
        //console.log("[stor] trying sync with cloud");
        LanternSync(self.browser_db, self.cloud_db, "cloud", continuous, status_fn, function(changed_doc) {
            refreshDocInCache(new LanternDocument(changed_doc, self));
            change_fn(changed_doc);
        });
        return;
    };



    return self;
});