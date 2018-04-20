window.LanternStor = (function($data) {

    // used to preserve keyspace when storing and sending low-bandwidth
    var REG = {
        owner: 0x00,
        editor: 0x01,
        created_at: 0x02,
        updated_at: 0x03,
        parent_doc: 0x04,
        child_doc: 0x05,
        name: 0x10,
        category: 0x20, 
        count: 0x30,
        status: 0x40,
        point0: 0x60,
        point1: 0x61,
        point2: 0x62,
        point3: 0x63,
        point4: 0x64,
        point5: 0x65,
        point6: 0x66,
        point7: 0x67,
        point8: 0x68,
        point9: 0x69,
        style: 0x90
    };


    console.log(REG);
    
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


    // so we can get back keys by value in REG
    function getKeyByValue( obj, value ) {
        for( var prop in obj ) {
            if( obj.hasOwnProperty( prop ) ) {
                 if( obj[ prop ] === value )
                     return prop;
            }
        }
    }

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
        var type = doc._id.split(":")[0];
        //console.log("[stor] cache doc:", doc._id, type);
        $data[type+"_docs"].push(doc);
        index = getIndexForDoc(doc._id, type);
        self.cache[doc._id] = {
            id: doc._id, 
            type: type,
            index: index
        };
    }

    function replaceInCache(doc) {
        var type = doc._id.split(":")[0];
        var index = getIndexForDoc(doc._id,type);
        //console.log("[stor] replace cache doc:", doc._id, type, index);
        // replace in cache
        $data[type+"_docs"].splice(index, 1, doc);
        self.cache[doc._id].index = index;
    }


    function refreshDocInCache(doc) {

        var type = doc._id.split(":")[0];
        var index;
        // is the document already cached?
        if (self.cache[doc._id]) {
            index = getIndexForDoc(doc._id,type);
            if (doc._deleted) {
                removeFromCache(doc._id);
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
                    return refreshDocInCache(expandDoc(result.doc));
                }));
            });
    }

    function compressDoc(doc) {
        var new_doc = {};
        for (var idx in doc) {
            if (typeof(doc[idx]) == "function") {
                // skip
                console.log(idx);
            }
            else if (REG[idx]) {
                new_doc[REG[idx]] = doc[idx];
            }
            else {
                new_doc[idx] = doc[idx];
            }
        }
        return new_doc;
    }

    function expandDoc(doc) {
        var new_doc = {};
        for (var idx in doc) {
            var key = getKeyByValue(idx);
            if (key) {
                new_doc[key] = doc[idx];
            }
            else {
                new_doc[idx] = doc[idx];
            }
        }
        return new_doc;
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
            })
            .then(function() {

            console.log("[stor] target = " + 
                (self.db.adapter == "http" ? "remote" : "local"));
            });
    };


    self.get = function() {
        console.log("[stor] get: " + arguments[0]);
        return self.db.get.apply(self.db, arguments)
            .then(function(doc) {
                return expandDoc(doc);
            });
    };

    self.remove = function() {
        var doc_id = arguments[0];
        var type = doc_id.split(":")[0];
        console.log("[stor] remove: " + doc_id);
        return self.db.remove.apply(self.db, arguments).then(function() {
            removeFromCache(doc_id);
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
        var compressed_doc = compressDoc(doc);
        console.log(compressed_doc);
        arguments[0] = compressed_doc;
        return self.db.put.apply(self.db, arguments).then(function() {
            addToCache(doc);
        });
    };

    self.upsert = function() {
        console.log("[stor] upsert " + arguments[0]);
        var fn = arguments[1];
        var new_doc;

        var wrapper_fn = function(old_doc) {
            new_doc = compressDoc(fn(old_doc));
            console.log(new_doc);
            return new_doc;
        };
        arguments[1] = wrapper_fn;

        return self.db.upsert.apply(self.db, arguments).then(function(results) {
            console.log(results);
            new_doc._rev = results.rev;
            refreshDocInCache(expandDoc(new_doc));
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




    return self;
});