__base = "../";

window.LanternDocument = (function(id,stor) {

    // used to preserve keyspace when storing and sending low-bandwidth
    var REG = {
        
        // private metadata won't relay over LoRa
        created_at: "$ca",   // creation date
        updated_at: "$ua",   // doc update date
        received_at: "$ra",  // doc received at (from radio)
        sent_at: "$sa",      // doc sent (with radio)
        imported_at: "$ia", // doc imported from disk, do not send over radio

        // public data for all sync and broadcast
        title: "tt",        // title or name of object
        text: "tx",         // text or label for object
        status: "st",       // level or quantity
        owner: "ou",        // user array
        editor: "eu",       // user array
        geo: "gp",          // geohash array
        tag: "tg",          // category or other tags
        style: "sl",        // css styles,
        parent: "pt",       // parent document reference
        child: "cd"         // child document reference

    };


    // so we can get back keys by value in REG
    function getKeyByValue( obj, value ) {
        for( var prop in obj ) {
            if( obj.hasOwnProperty( prop ) ) {
                 if( obj[ prop ] == value )
                     return prop;
            }
        }
    }

    function hex8(val) {
        val &= 0xFF;
        var hex = val.toString(16).toUpperCase();
        return ("00" + hex).slice(-2);
    }


    //------------------------------------------------------------------------
    
    var self = {
        data: {}
    };

    self.has = function(k,s) {

        var key = (REG[k] ? REG[k] : k);

        var val = self.data[key]; 


        // easy access for nested keys one level down
        if (s && val) {
            if (val instanceof Array) {
                return val.indexOf(s) != -1;
            }
            else {
                return val.hasOwnProperty(s);
            }
        }
        else {
            return self.data.hasOwnProperty(key);
        }
    };

    self.get = function(k,s) {

        var key = (REG[k] ? REG[k] : k);
        var val = self.data[key]; 

        // easy access for nested keys one level down
        if (s) {
            if (typeof(val) == "object" && val.hasOwnProperty(s)) {
                return val[s];
            }
            else {
                return;
            }
        }
        else {
            return val;
        }
    };

    self.set = function(k, s, val) {

        var key = (REG[k] ? REG[k] : k);

        // support one level of nested keys
        if (val === undefined) {
            val = s;
            self.data[key] = val;
        }
        else {
            self.data[key] = self.data[key] || {};
            self.data[key][s] = val;
        }
    };

    self.push = function(k,val) {
        var key = (REG[k] ? REG[k] : k);
        self.data[key] = self.data[key] || [];
        self.data[key].push(val);
    };

    self.pop = function(k,val) {

        var key = (REG[k] ? REG[k] : k);

        if (val === undefined) {
            delete self.data[key];
        }
        else {
            self.data[key] = self.data[key] || [];
            var index = self.data[key].indexOf(val);
            self.data[key].splice(index,1);
        }
    };

    self.save = function() {

        self.set("updated_at", new Date());

        return stor.upsert(self.id, function(doc) {
            for (var idx in self.data) {
                doc[idx] = self.data[idx];
            }

            if (!self.has("created_at")) {
                self.set("created_at", new Date());
            }
            return doc;
        })
        .catch(function(err) {
            if(err.name === "conflict") {
                console.log("[doc] conflicted: " + doc._id, err);
            }
            else {
                console.log("[doc] err", err);
            }

        });
    };


    self.remove = function() {
        return stor.remove(self.id);
    };

    /**
    * Constructs JSON object preserving key register
    */
    self.toJSON = function() {
        var new_doc = {};
        for (var idx in self.data) {
            new_doc[idx] = self.data[idx];
        }
        return new_doc;
    };

    /**
    * Constructs JSON but converts keys into human-readable format by register
    */
    self.toJSONFriendly = function() {
        var new_doc = {};
        for (var idx in self.data) {
            var key = getKeyByValue(REG, idx);
            if (key) {
                new_doc[key] = self.data[idx];
            }
            else {
                new_doc[idx] = self.data[idx];
            }
        }
        return new_doc;
    };


    //------------------------------------------------------------------------

    if (!id) {
         throw new Error("LanternDocument missing required ID");
    }


    if (typeof(id) == "object") {
        var doc = id;   
        self.id = doc._id;
        for (var idx in doc) {
            self.set(idx, doc[idx]);
        }
    }
    else {
        self.id = id;
    }

    

    return self;
});
window.LanternImport = function(stor) {
    
    console.log("[import] begin...");

    var self = {};


    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addCategory(title, slug, color, background_color) {
        var doc = new LanternDocument("c:"+slug, stor);
        doc.set("title", title);
        doc.set("style", {
            "color": color, 
            "background-color": background_color}
        );
        doc.set("$ia", new Date());
        doc.save();
    }
    
    function addSupplyStation(id, title, geo) {
        var venue_doc = new LanternDocument(id, stor);
        venue_doc.set("title", title);
        venue_doc.set("geo", [geo]);
        venue_doc.set("$ia", new Date());
        venue_doc.save();

        var supply_id = "s:wtr-" + Math.round((Math.random()*100000));
        var supply_doc = new LanternDocument(supply_id, stor);
        supply_doc.set("status", 1);
        supply_doc.push("parent", id);
        supply_doc.push("tag", "c:wtr");
        supply_doc.set("$ia", new Date());
        supply_doc.save();
    }



    //------------------------------------------------------------------------
    self.category = function() {
        //console.log(" adding default resource categories");
        addCategory("Shelter", "shr", "ffcc54", "fff7ef");
        addCategory("Water", "wtr", "78aef9", "e9f2fe");
        addCategory("Fuel", "ful", "c075c9", "f5e9f6");
        addCategory("Internet", "net", "73cc72", "e8f7e8");
        addCategory("Medical", "med", "ff844d", "ffebe2");
        addCategory("Donations", "dnt", "50c1b6", "e3f5f3");
        addCategory("Power", "pwr", "f45d90", "f2dae2");
        addCategory("Equipment", "eqp", "4aaddb", "e8f4fa");
    };


    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    self.venue = function() {
        //console.log(" adding default venues");
        addSupplyStation("v:css", "Central City Supply Station", "u4pruydq");
        addSupplyStation("v:ost", "OXFAM Supply Truck", "u4pruyed");
        addSupplyStation("v:rcm", "Red Cross Morristown HQ", "u4pruyqr");
    };


    self.supply = function() {
        // supplies to be added directly along-side venues
    };

    self.route = function() {
        //console.log(" adding default geo routes"); 
        var doc = new LanternDocument("r:test-route", stor);
        doc.set("geo", ['u4pruydq', 'u4pruyde']);
        doc.set("$ia", new Date());
        doc.save();
    };


    self.note = function() {
        //console.log(" adding default notes");
        var doc = new LanternDocument("n:test-note", stor);
        doc.push("tag", "v:test-place");
        doc.set("$ia", new Date());
        doc.save();
    };

    self.all = function() {
        self.category();
        self.venue();
        self.route();
        self.note();
    };



    //------------------------------------------------------------------------
    return self;
};

    
window.LanternPage= (function(id, vue_opts, preload) {

    var self = {
        base_uri: "http://" + (window.location.host == "localhost:3000" 
                ? "localhost:8080" :  window.location.host),
        user: null
    };

    console.log("[page] -------------------------------------- " + id);
    

    function registerUser() {
        console.log("[user] registering new user");
        var doc = new LanternDocument("u:"+self.getUserId(), self.stor);
        doc.save();
        return doc;
    }

    function getUser() {
        return self.stor.get("u:"+self.getUserId()).then(function(doc) {
            console.log("[page] existing user:", doc._id);
            self.vm.$data.user = doc;
            return new LanternDocument(doc, self.stor);
        });
    }

    //------------------------------------------------------------------------

    self.getUserId = function() {
        var uid = window.localStorage.getItem("lantern-profile");
        if (!uid) {
            uid = Math.round(Math.random()*1000000);
            window.localStorage.setItem("lantern-profile", uid);
        }
        return uid;
    };
         
    self.getOrCreateUser = function(){
        return getUser()
            .catch(function(result) {
                return registerUser();
            });
    };

    self.vm = new Vue(vue_opts);
    self.stor = new LanternStor(self.vm.$data);

    self.stor.setup(preload)
        .then(self.getOrCreateUser)
        .then(function(user) {
            self.user = user;
            var cached = self.stor.getCached(user.id);
            self.vm.$data.user = cached;
            self.vm.$mount('#' + id + '-app');
        });

    return self;
  
});
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
                    return refreshDocInCache(new LanternDocument(result.doc, self));
                }));
            });
    }

    function pickDatabase() {
        if (self.db) return Promise.resolve(self.db);

        return new Promise(function(resolve, reject) {

            // fall-back for older devices that might not know how to handle indexDB
            var timer = setTimeout(function() {
                console.log("timed out looking for local db. use remote storage...");
                if (!self.db) {
                    self.db = self.remote_db;
                    resolve(self.db);
                }
            }, 300);

            self.local_db.info()
                .then(function (result) {
                    clearTimeout(timer);
                    self.db = self.local_db;
                    resolve(self.db);
                }).catch(function(err) {
                    clearTimeout(timer);
                    
                    if (err.status == 500) {
                        if (err.reason == "Failed to open indexedDB, are you in private browsing mode?") {
                            // may be in private browsing mode
                            // attempt in-memory stor
                            // some browsers may not allow us to stor data locally
                            console.log("may be in private browsing mode. using remote storage...");
                            self.db = self.remote_db;
                        }
                        else if (err.reason == "QuotaExceededError") {
                            console.log("quota exceeded for local storage. using remote storage...");
                            self.db = self.remote_db;
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
                    (self.db.adapter == "http" ? "remote" : "local")
                );
            });
    };


    self.get = function() {
        console.log("[stor] get: " + arguments[0]);
        return self.db.get.apply(self.db, arguments)
            .then(function(doc) {
                refreshDocInCache(new LanternDocument(doc), self);
                return doc;
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
            if (info.change.docs) {
                console.log("[stor] did %s to remote database: %s docs", 
                        info.direction, 
                        info.change.docs.length);
                for (var idx in info.change.docs) {
                    refreshDocInCache(new LanternDocument(info.change.docs[idx], self));
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
