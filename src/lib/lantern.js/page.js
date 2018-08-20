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

