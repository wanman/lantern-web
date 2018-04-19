window.LanternStor = (function($data) {

    var remote_uri = window.location.origin + "/db/lantern";

    var self = {
        cache: {},        
        local_db: new PouchDB("lantern"),
        remote_db: new PouchDB(remote_uri.replace(":3000", ":8080"), {
            skip_setup: true,
            withCredentials: false        
        }),
        db: null
    };

    //------------------------------------------------------------------------


    function getIndexForDoc(type, id) {
        var doc_id_list = $data[type+"_docs"].map(function(compare_doc) {
            return compare_doc._id;
        });
        var index = doc_id_list.indexOf(id);
        return index;
    }

    function refreshDocInCache(doc) {

        var type = doc._id.split(":")[0];
        var index;
        // is the document already cached?
        if (self.cache[doc._id]) {
            index = getIndexForDoc(type, doc._id);
            if (doc._deleted) {
                console.log("[stor] delete from cache", doc._id, index);
                $data[type+"_docs"].splice(index, 1);
                self.cache[doc._id] = null;
            }
            else {
                console.log("[stor] replace cache doc:", doc._id, index);
                // replace in cache
                $data[type+"_docs"].splice(index, 1, doc);
                self.cache[doc._id].index = index;
            }
            
        }
        else {
            // insert new to cache
            //console.log("[stor] cache doc:", doc._id);
            $data[type+"_docs"].push(doc);
            index = getIndexForDoc(type, doc._id);
            self.cache[doc._id] = {
                id: doc._id, 
                type: type,
                index: index
            };
        }
    }

    function loadDocuments(type) {
        //console.log("[stor] loading type: " + type);
        var params = {
            startkey: type+':', 
            endkey: type + ":\ufff0", 
            include_docs: true
        };
        return self.db.allDocs(params)
            .then(function(result) {
                return Promise.all(result.rows.map(function(result) {
                    return refreshDocInCache(result.doc);
                }));
            });
    }

    function pickDatabase() {
        if (self.db) return Promise.resolve(self.db);
        return self.local_db.info()
            .then(function (result) {
                self.db = self.local_db;
                return self.db;
            }).catch(function(err) {
                if (err.status == 500) {
                    if (err.name == "indexed_db_went_bad") {
                        // may be in private browsing mode
                        // attempt in-memory stor
                        // some browsers may not allow us to stor data locally
                        console.log("may be in private browsing mode. refusing to cache data in browser");
                        self.db = self.remote_db;
                        return self.db;
                    }
                }
            });
    }

    //------------------------------------------------------------------------

    self.setup = function(types) {
        return pickDatabase()
            .then(function() {
                if (types && types.length) {
                    return Promise.all(types.map(function (type) {
                        if (!$data[type+"_docs"]) {
                            $data[type+"_docs"] = [];
                        }
                        return loadDocuments(type);
                    }));
                }
            }).then(function() {
                setTimeout(self.sync, 1500);
            });
    };


    self.getCached = function(id) {
        var cached = self.cache[id];
        if (!cached) return;
        return $data[cached.type+"_docs"][cached.index];
    };


    self.sync = function() {
        if (self.db.adapter == "http") {
            console.log("[stor] skipping sync since target is remote");
            return;
        }
        else {
            console.log("[stor] starting sync");
        }
        self.local_db.sync(self.remote_db, {
            live: true,
            retry: true
        })
        .on('change', function (info) {
            console.log(info);
            if (info.change.docs) {
                console.log("[stor] did %s to remote database: %s docs", 
                        info.direction, 
                        info.change.docs.length);
                for (var idx in info.change.docs) {
                    refreshDocInCache(info.change.docs[idx]);
                }
            }
        })
        .on('error', function (err) {
            console.log("[stor] sync err", err);
        });
        return;
    };


    self.deleteAll = function() {
        return self.db.allDocs()
            .then(function (result) {
                // Promise isn't supported by all browsers; you may want to use bluebird
                return Promise.all(result.rows.map(function (row) {
                    console.log("[stor] delete " + row.id  + " " + row.value.rev);
                    return self.db.remove(row.id, row.value.rev);
                }));
            }).then(function () {
                console.log("[stor] finished deleting all docs");
              // done!
            }).catch(function (err) {
                console.log(err);
              // error!
            });
     };


    return self;
});