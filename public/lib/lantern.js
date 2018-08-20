__base = "../";

window.LanternDocument = (function(id,stor) {
 
    
    // used to preserve keyspace when storing and sending low-bandwidth
    var REG = {
        
        // private metadata won't relay over LoRa
        created_at: "$ca",   // creation date
        updated_at: "$ua",   // doc update date
        sent_at: "$sa",      // doc sent (with radio)
        imported_at: "$ia", // doc imported from disk, do not send over radio


        // radio-specific metadata
        received_at: "$ra",  // doc received at (from radio)
        version: "$rv", // passed across radio messages

        // public data for all sync and broadcast
        title: "tt",        // title or name of object
        slug: "sg",         // slug for object
        text: "tx",         // text or label for object
        icon: "ic",         // icon to describe object
        status: "st",       // level or quantity
        owner: "ou",        // user array
        editor: "eu",       // user array
        geo: "gp",          // geohash array
        radius: "rd",       // geographic radius
        category: "ct",     // category tag
        tag: "tg",          // other tags
        style: "sl",        // css styles,
        parent: "pt",       // parent document reference
        child: "cd",        // child document reference,

        // verification parameters / votes for accuracy
        vote: "vt", // @todo remove depracated vote dictionary
        vote_red_cross: "vr",
        vote_neighbors: "vn",
        vote_officials: "vo",
        vote_oxfam: "vx",
        vote_un: "vu",
        vote_fema: "vf"

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

    function post(doc) {
        return stor.post(doc)
            .then(function(results) { 
                console.log("[" + self.id + "] saved", results.rev);
                self.data._rev = results.rev;
                return doc;
            })
            .catch(function(err) {
                if(err.name === "conflict") {
                    console.log("["+self.id+"] conflicted", err);
                }
                else {
                    console.log("["+self.id+"] err", err);
                }
            }); 
    }

    function hasNewData(old_doc) {

        for (var k in self.data) {
            if (old_doc.data.hasOwnProperty(k)) {
                var old_val = JSON.stringify(old_doc.data[k]);
                // don't compare $ meta
                if (k[0] != "$" && self.has(k)) {
                    var new_val = JSON.stringify(self.data[k]);
                    if (old_val != new_val) {
                        console.log("[" + self.id + "] has new data:",  k, new_val)
                        return true;
                    }
                }   
            }
            else {
                return true;
            }
        }
        return false;
    }



    //------------------------------------------------------------------------
    
    var self = {
        id: null,
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
        if (!self.has(k, val)) {
            self.data[key].push(val);
        }
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

    self.save = function(check_existing, skip_if_exists) {

        if (!self.has("created_at")) {
            self.set("created_at", new Date());
        }
        else {
            self.set("updated_at", new Date());
        }

        var doc = {
            _id: self.id
        };

        if (self.data._rev) {
            doc._rev = self.data._rev;
        }
        
        for (var idx in self.data) {
            if (idx != "$ra" && idx != "$rx" ) {
                doc[idx] = self.data[idx];
            }
        }


        if (check_existing) {
            // make sure we're not saving duplicate document
            return stor.get(self.id, true).then(function(old_doc) {
                
                if (!skip_if_exists && hasNewData(old_doc)) {
                    doc._rev = old_doc.get("_rev");
                    return post(doc);
                }
                else {
                    //console.log("[" + self.id + "] skipping save by request");
                    return;
                }
            })
            .catch(function(err) {
                console.log(err);
                return post(doc);
            });
        }
        else {
            return post(doc);
        }
    };


    self.remove = function() {
        return stor.remove(self.id, self.data._rev);
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

    // random identifiers for new docs to avoid sync conflicts
    self.id = self.id.replace("%%", Math.round(Math.random() * 1000));

    if (!stor) {
        console.log("[" + self.id + "] missing required stor object");
    }

    return self;
});
window.LanternPage = (function(id) {

    // view options
    var vue_opts = {
        data: {
            cloud_connected: null,
            lantern_connected: null,
            lantern: {},
            page_title: "",
            page_tag: "",     
            page_action_icon: "",
            page_action_helper: null,
            page_loading: true,
            is_syncing: false,
            sync_label: "Syncing",
            allow_back_button: false,
            user: null
        },
        methods: {
            handleGoBack: function() {  
                if (window.history.length) {
                    window.history.go(-1);
                }
                else {
                    var url = window.location.href;
                    window.location = url.substring(0,url.lastIndexOf("/"));
                }
            }

        }
    };

    // default cross-domain JSON request options
    var fetch_opts = {
         mode: "cors",
         cache: "no-cache",
         headers: {
            "Content-Type": "application/json; charset=utf-8"
         }
    };

    // geolocation options
    var geo_options = {
        enableHighAccuracy: false, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    //------------------------------------------------------------------------
    var self = {
        geo: null, // user geohash location
        stor: null, // database storage
        user: null, // user document
        view: null, // vue app
        map: null // leaflet map
    };


    // prevents duplicate assignments of same location to device
    var did_assign_location = false;

    // initialize arrays for each type of doc
    // only these document types will ever be accepted by the system
    (["v", "i", "c", "r", "n", "u", "d"]).forEach(function(type) {
        vue_opts.data[type+"_docs"] = [];
    });




    //------------------------------------------------------------------------
    function findBestLanternDevice(domain) {
        self.setBaseURI(window.location.protocol + "//" + domain);

        var cloud = false;
        var lantern = false;

        return fetch(self.getBaseURI() + "/api/info", fetch_opts)
            .then(function(result) {
                return result.json();
            })
            .then(function(json) {
                console.log("[page] lantern selected:", json);
                self.view.$data.lantern = json;
                try {
                    cloud = (json.cloud == true);
                    lantern = (json.cloud == false);                    
                }
                catch(e) {
                    // if missing "cloud" value, leave defaults...
                }

                self.view.$data.cloud_connected = cloud;
                self.view.$data.lantern_connected = lantern;
            })
            .catch(function(err) {
                console.log(err);
                if (window.location.hostname == "localhost" && domain == "lantern.global") {
                    // allow developers to use localhost docker image
                    return findBestLanternDevice("localhost");
                }
                else {
                    self.view.$data.cloud_connected = cloud;
                    self.view.$data.lantern_connected = lantern;
                }
            });
    }


    /**
    * Get anonymous user identifier retained in local storage per browser
    */
    function getUserId() {
        var uid = window.localStorage.getItem("lantern-profile");
        if (!uid) {
            uid = Math.round(Math.random()*1000000);
            window.localStorage.setItem("lantern-profile", uid);
        }
        return uid;
    }

    /**
    * Register new user in the database 
    */
    function registerUser() {
        console.log("[user] create");
        var doc = new LanternDocument("u:"+getUserId(), self.stor);
        doc.save();
        return doc;
    }

    /**
    * Get user from database 
    */
    function getUser() {
        return self.stor.get("u:"+getUserId()).then(function(doc) {
            //console.log("[user] found", doc.get("_id"));
            self.view.$data.user = doc.toJSONFriendly();
            return doc;
        });
    }



    /**
    * Make sure we have an anonymized user identifier to work with always
    */ 
    function getOrCreateUser() {
        return getUser()
            .catch(function(result) {
                return registerUser();
            });
    }


    /**
    * Display a sync icon in footer momentarily
    */
    function showSyncIcon(doc) {
        
        if (doc._deleted == true) {
            self.view.$data.sync_label = "Syncing";
            self.view.$data.is_syncing  = true;
        }

        else {
            self.view.$data.is_syncing = true;
            
            // display title of doc where possible
            if (doc && doc.hasOwnProperty("tt")) {
                self.view.$data.is_syncing = doc.tt;

                if (doc._rev.split("-")[0] == "1") {
                    self.view.$data.sync_label = "Adding";
                }
                else {
                    self.view.$data.sync_label = "Updating";
                }
            } 
        }

        setTimeout(function() {
            self.view.$data.sync_label = "Syncing";
            self.view.$data.is_syncing = false;
        }, 1000);
    }


    /**
    * Handle each document change
    */
    function handleDocumentChange(changed_doc) {

        console.log("[db:lnt] change: " + changed_doc._id);

        showSyncIcon(changed_doc);

        if (changed_doc._id == ("d:" + self.view.$data.lantern.id)) {
            self.view.$data.lantern.name = changed_doc.tt;
        }
        // always refresh document cache after change
        var doc = new LanternDocument(changed_doc, self.stor);
        self.stor.refreshDocInCache(doc);
    }


    /**
    * Do map sync only once we have a good main data sync initiated
    */ 
    function handleSyncStatusChange(status) {
        //console.log("[db] sync status", status); 
    }



    //------------------------------------------------------------------------
    /** 
    * Define helper for user interactions
    **/
    self.addHelper = function(name, fn) {
        vue_opts.methods[name] = fn;
    };
    
    /** 
    * Define data for vue templates
    **/
    self.addData = function(name, val) {
        vue_opts.data[name] = val;
    };

    /** 
    * Mount vue to our top-level document object
    **/
    self.render = function() {
        self.view = new Vue(vue_opts);
        self.view.$mount(["#", id, "-page"].join(""));
        return Promise.resolve();
    };

    /**
    * Add in data from PouchDB and identify network status
    */
    self.connect = function() {
        return findBestLanternDevice("lantern.global")
            .then(function() {
                self.stor = new LanternStor(self.getBaseURI(), "lnt", vue_opts.data);
                return self.stor.setup();
            })
            .then(getOrCreateUser)
            .then(function(user) {
                // make sure we have an anonymous user all the time
                self.user = self.view.$data.user = user;
            })
            .then(function() {
                // if we can access the database, start sync
                self.stor.host_db.info().then(function() {
                    self.stor.sync(true, handleSyncStatusChange, handleDocumentChange, 100);                    
                });
                
            });
    };

    self.getVenues = function() {
        return self.stor.getManyByType("v");
    };

    self.getItems = function() {
        return self.stor.getManyByType("i");
    };


    self.getCategories = function() {
        return self.stor.getManyByType("c");
    };

    self.getUsers = function() {
        return self.stor.getManyByType("u");
    };

    self.getDevices = function() {
        return self.stor.getManyByType("d");
    };

    self.getRoutes = function() {
        return self.stor.getManyByType("r");
    };

    self.getNotes = function() {
        return self.stor.getManyByType("n");
    };


    
    self.createMapManager = function() {
        return new Promise(function(resolve, reject) {
            console.log("[page] map manager");


            if (self.map) {
                self.map.clear();
                resolve(self.map);
            }
            else {

                var cache = !(self.view.$data.lantern && self.view.$data.lantern.cloud);
                var db_uri;
                
                if (self.view.$data.lantern && self.view.$data.lantern.cloud == false) {

                    // working offline connected to device
                    db_uri = self.getBaseURI() + "/db/map";

                    var min_docs = 300;

                    new PouchDB("map").info().then(function(local_res) {
                        var current_docs = local_res.doc_count;

                        console.log("[page] map cache: " + current_docs + " / " + min_docs);

                        if (current_docs > min_docs) {
                            db_uri = "map";
                            console.log("[page] using offline map cache");
                        }

                        self.map = new LanternMapManager(db_uri, cache, cache);
                        resolve(self.map);
                    });
                }
                else {
                    // fall-back to offline cache if we are not connected direct to lantern
                    self.map = new LanternMapManager("map", cache, cache);
                    resolve(self.map);
                }
            }
        });
    };



    /**
    * Display the map for the user based on approx. location
    */
    self.renderMap = function(venues, show_tooltip, icon, color) {

        venues = venues || [];

        return new Promise(function(resolve, reject) {
            self.createMapManager().then(function() {
                var venue_options = {};
                items = self.stor.getManyCachedByType("i");
                
                items.forEach(function(item){
                    if (item.parent && item.category) {
                        var v = item.parent[0];
                        var c_doc = "c:"+item.category[0];
                        venue_options[v] = venue_options[v] || [];
                        venue_options[v].push(self.stor.getCached(c_doc));
                    }
                });

                // add venues to map

                venues.forEach(function(v_id) {
                    var coords = [];
                    var venue = self.stor.getCached(v_id);
                    
                    if (venue.geo) {
                        for (var idx in venue.geo) {
                            try {
                                var c = Geohash.decode(venue.geo[idx]);
                                coords.push(c);
                            }
                            catch(e) {
                                console.error("[page] invalid geohash " + venue.geo + " for: " + v_id);
                            }
                        }   
                    }

                    if (coords.length == 1) {
                        // point
                        var final_icon = icon || venue_options[venue._id][0].icon;
                        var final_color = color || venue_options[venue._id][0].style.color;
                        var pt = self.map.addPoint(venue.title, coords[0], final_icon, final_color);
                       

                        if (show_tooltip) {
                            
                            pt.on("click", function(e) {
                                window.location = "/apps/rdr/detail.html#mrk=" + v_id;
                            });

                            pt.openTooltip();
                        }

                    }
                    else if (coords.length == 2) {
                        // draw a shape
                        self.map.addPolygon(venue.title, coords);
                    }
                });
                resolve(self.map);
            });
        });
    };
        
    // @todo fall-back to lantern geolocation if GPS sensor not available
    self.askForLocation = function() {
        return new Promise(function(resolve, reject) {
            //console.log("[page] asking for location");
            navigator.geolocation.getCurrentPosition(function(position) {
                resolve(position);
            }, function(err) {
                reject(err);
            }, geo_options);
          
        });
    };


    /**
    * Update connected device with geolocation
    */
    self.sendGeohashToLantern = function(geohash) {


        // only try to set location once per page-load
        if (did_assign_location) {
            return;
        }

        did_assign_location = true;

        // tell device to use this as it's most recent location (skip GPS)
        fetch(self.getBaseURI() + "/api/geo",
        {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }, 
            body: JSON.stringify({"geo": geohash })
        }).then(function() {
            console.log("[page] assigned geohash to lantern: " + geohash);
        })
        .catch(function(err) {
            console.log("[page] skipping geo assignment since no lantern connection");
        });

    };



    /**
    * Points to the right server for processing requests
    */
    self.getBaseURI = function() {
        return lantern_uri;
    };


    self.setBaseURI = function(uri) {
        lantern_uri = uri;
    };

    
    /**
    * Get a query parameter value
    */
    self.getHashParameterByName = function(name, url) {
        if (!url) url = window.location.hash;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[#&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };    

    /**
    * Extract a category object from meaningful input such as a tag
    */
    self.addHelper("getCategory", function(arg) {
        if (!arg) {
            return;
        }
        var obj;
        if (typeof(arg) == "string") {
            obj = self.stor.getCached(arg);
        }
        else if (arg.hasOwnProperty("category")) {
            obj = self.stor.getCached(obj.category[0]);
        }
        else if (typeof(arg[0]) == "string") {
            obj = self.stor.getCached("c:"+arg[0]);
        }
        else if (arg.hasOwnProperty("style")) {
            obj = arg;
        }
        else {
            console.log("cannot make category style for", arg);
        }
        return obj;
    });


    self.addHelper("timestamp", function(item) {
        // make sure we have a most recent timestamp to work with
        var timestamp = item.updated_at || item.created_at || item.imported_at;
        return moment(timestamp).fromNow();
    });

    /**
    * Extract background and stroke colors from database
    */
    self.addHelper("makeCategoryStyle", function(cat) {
        if (!cat) return;
        var doc = new LanternDocument(cat, self.stor);
        var style = ["color: #" + doc.get("style","color")];
        style.push("background-color: #" + doc.get("style", "background-color"));
        style.push("border-color: #" + doc.get("style", "color"));
        return style.join("; ");
    });
    
    /**
    * Extract icon from database
    */
    self.addHelper("makeCategoryIconClass", function(category) {
        if (!category) return;
        return "fas fa-" + (category.icon || "circle") + " fa-lg";
    });


    /**
    * Display proper pluralization for users
    */

    self.addHelper("pluralize", function(count) {
        if (count === 0) {
            return 'No Users';
        } 
        else if (count === 1) {
            return '1 User';
        } else {
            return count + ' Users';
        }
    });

    //------------------------------------------------------------------------
    /**
    * Setup universal template variables
    */
    vue_opts.data.showNavMenu = false;

    /**
    * Setup global view helpers
    */
    vue_opts.methods.toggleNavigation = function(el) {
        self.view.$data.showNavMenu = !self.view.$data.showNavMenu;

        if (self.view.$data.showNavMenu) {
            self.getUsers();
        }
    };



    //------------------------------------------------------------------------
    return self;
});


if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register('/worker/sw.js', {
        scope: "/"
    }).then(function(registration) {
        // success
        console.log("[sw] registered service worker");
    }).catch(function(e) {
        // failed
        console.log("[sw] err", e);
    });
}
window.LanternStor = (function(uri, db_name, $data) {

    var self = {
        doc_cache: {}, 
        browser_db: null,
        host_db: new PouchDB(uri + "/db/" + db_name, {
            skip_setup: true,
            withCredentials: false        
        }),
        db: null
    };

    try {
        self.browser_db = new PouchDB(db_name);
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

        console.log("[cache] remove", doc_id, index);
        if (index == -1) return;
        $data[type+"_docs"].splice(index, 1);
        self.doc_cache[doc_id] = null;
    }

    function addToCache(doc) {
        var index;

        var type = doc.id.split(":")[0];
        var obj = doc.toJSONFriendly();
        if (obj._deleted == true) {
            return;
        }
        //console.log("[cache] add " + doc.id,  obj);
        var type_key = type+"_docs";
        if (!$data.hasOwnProperty(type_key)) {
            $data[type_key] = [];
        }

        // make sure we don't double-add to cache
        index = getIndexForDoc(doc.id, type);
        if (index != -1) {
            // console.log("[cache] found existing index for " + doc.id, index);
        }
        else {
            $data[type_key].push(obj);
            index = getIndexForDoc(doc.id, type);
            self.doc_cache[doc.id] = {
                id: doc.id, 
                type: type,
                index: index
            };

        }
    }

    function replaceInCache(doc) {
        var type = doc.id.split(":")[0];
        var index = getIndexForDoc(doc.id,type);
        // replace in cache
        var obj = doc.toJSONFriendly();

        var cached = self.getCached(doc.id);
        if(!cached) {
            console.log("[stor] skip missing cache for: " + doc.id);
            return;
        }
        if (cached._rev == obj._rev) {
            //console.log("[stor] skip cache replace since same rev", obj._id, obj._rev);
        }
        else {

            console.log("[cache] replace", obj._id, obj._rev);

            $data[type+"_docs"].splice(index, 1, obj);
            self.doc_cache[doc.id].index = index;

        }
    }



    //------------------------------------------------------------------------

    self.refreshDocInCache = function(doc) {
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
    };

    /**
    * Select remote or local database
    */
    self.setup = function() {

         //console.log("[stor] picking database");
        if (self.db) return Promise.resolve(self.db);

        // default to host db
        self.db = self.host_db;

        return new Promise(function(resolve, reject) {

            // fall-back for older devices that might not know how to handle indexDB
            var timer = setTimeout(function() {
                console.log("timed out looking for local db. use remote storage...");
                if (!self.db) {
                    resolve();
                }
            }, 1000);

            if (!self.browser_db) {
                return resolve(self.db);
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
                            resolve(self.db);
                        }
                        else if (err.reason == "QuotaExceededError") {
                            console.log(err);
                            console.log("quota exceeded for local storage. using remote storage...");
                            resolve(self.db);
                        }
                    }
                    else {
                        clearTimeout(timer);
                        reject(err);
                    }
                });
        });
    };


    self.get = function(id, allow_cached) {

        var doc;

        return new Promise(function(resolve, reject) {
            if (allow_cached) {
                var cached = self.getCached(id);
                if (cached) {
                    doc = new LanternDocument(cached, self);
                    console.log("[stor] get (cached): " + id);
                    return resolve(doc);
                }
            }
            
            self.db.get(id)
                .then(function(data) {
                    //console.log("[stor] get: " + id);
                    doc = new LanternDocument(data, self);
                    self.refreshDocInCache(doc);
                    resolve(doc);
                })
                .catch(function(err) {
                    if (err.name == "not_found") {
                        console.log("[stor] get (not found): " + id);                        
                    }
                    reject(err);
                });
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
                    self.refreshDocInCache(doc);
                    return doc;
                }));
            });
    };


    self.remove = function() {
        var doc_id = arguments[0];
        var rev = arguments[1];
        var type = doc_id.split(":")[0];
        console.log("[stor] remove: " + doc_id, rev);
        return self.db.remove.apply(self.db, arguments).then(function(result) {
            removeFromCache(doc_id);
            return result;
        })
        .catch(function (err) {
            console.log(err);
            // error!
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
            });
     };

    self.put = function() {
        var doc = arguments[0];
        console.log("[stor] put: ", doc);
        return self.db.put.apply(self.db, arguments).then(function(results) {
            self.refreshDocInCache(new LanternDocument(doc, self));
            return results;
        });
    };

    self.post = function() {
        var doc = arguments[0];
        //console.log("[stor] post: ", doc);
        return self.db.put.apply(self.db, arguments).then(function(results) {
            doc._rev = results.rev;
            self.refreshDocInCache(new LanternDocument(doc, self));
            return results;
        });
    };


    self.getCached = function(id) {
        var cached = self.doc_cache[id];
        if (!cached) return;
        return $data[cached.type+"_docs"][cached.index];
    };

    self.getCachedIndex = function(id) {
        var cached = self.doc_cache[id];
        if (!cached) return;
        return cached.index;
    };


    self.getManyCachedByType = function(type) {
        return $data[type+"_docs"] || [];
    };


    self.refreshCached = function(doc) {
        return self.refreshDocInCache(doc);
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
        });
    };


    /**
    * Sync our in-browser database with the one on a physical device over wifi
    */
    self.sync = function(continuous, status_fn, change_fn, batch_size, pull_only) {
       
        console.log("[stor] sync %s <--> %s", self.browser_db.name, self.host_db.name);

        if (self.db.name == self.host_db.name) {
            console.log("[stor] skipping sync since target is lantern already");
            if (status_fn && typeof(status_fn) == "function") {
                status_fn(true);
            }
            return;
        }

        LanternSync(self.browser_db, self.host_db, db_name, continuous, status_fn, function(changed_doc) {

            if (change_fn && typeof(change_fn) == "function") {
                try {
                    change_fn(changed_doc);
                }
                catch(e) {
                    console.log(e);
                }
            }
        }, batch_size, pull_only);

        return;
    };

    return self;
});
window.LanternSync = function LanternSync(src, dest, label, continuous, status_fn, change_fn, batch_size) {
    var reset_delay;


    function setStatus(status) {
        if (status == true) {
            reset_delay = true;
        }
        if (status_fn && typeof(status_fn) == "function") {
            status_fn(status);
        }
    }

    // @todo expore pouchdb bug where this may be run twice
    function backOffSync(delay) {
        

        if (reset_delay) {
            reset_delay = false;
            return 0;
        }
        
        //console.log("[" + label + "] retry sync in: " + delay);
        if (delay === 0) {
          return 3000;
        }
        return delay * 3;
    }

    var opts =  {
        since: 0,
        batch_size: batch_size || 500,
        live: continuous || false,
        retry: true,
        back_off_function: backOffSync
    };

    
    var replication_handler = src.sync(dest, opts);

    replication_handler
    .on('paused', function(err) {
        if (err) {
            console.log("[db:" + label +"] lost connection");
            setStatus(false);
        }
    })
    .on('active', function() {
        //console.log("[db:" + label + "] active sync");
        setStatus(true);
    })
    .on('change', function (info) {
        setStatus(true);
        if (change_fn && typeof(change_fn) == "function") {
            if (info.change.docs) {
                console.log("[db:" + label + "] %s: %s docs", 
                        info.direction, 
                        info.change.docs.length);
                info.change.docs.forEach(change_fn);            
            }
        }

    })
    .on('error', function (err) {
        console.log("[db:" + label + "] sync err", err);
    });


    if (continuous) {
        // make sure to cancel any outstanding replication
        window.addEventListener('beforeunload', function(event) {
            try {
                replication_handler.cancel();

                console.log("[db:" + label + "] stop sync");
            }
            catch(e) {
                console.log("failed to stop sync", label);
            }
        });
    }
    
    return replication_handler;
};
