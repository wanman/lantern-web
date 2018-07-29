window.LanternPage = (function(id) {

    // view options
    var opts = {
        data: {
            cloud_connected: null,
            lantern_connected: null,
            lantern_name: "",
            page_title: "",
            page_tag: "",     
            page_action_icon: "",
            page_action_helper: null,
            page_loading: true,
            is_syncing: false,
            allow_back_button: false,
            user: null
        },
        methods: {
            handleGoBack: function() {
                window.history.go(-1);
            }

        }
    };

    // geolocation options
    var geo_options = {
        enableHighAccuracy: false, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    var self = {
        geo: null, // user geohash location
        stor: null, // database storage
        user: null, // user document
        view: null, // vue app
        map: null // leaflet map
    };

    var did_assign_location = false;


    // initialize arrays for each type of doc
    // only these document types will ever be accepted by the system
    (["v", "i", "c", "r", "n", "u", "d"]).forEach(function(type) {
        opts.data[type+"_docs"] = [];
    });

    //------------------------------------------------------------------------

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
            // don't interrupt interface for basic document deletes
            return;
        }
        setTimeout(function() {
            if (self.view.$data.is_syncing) return;
            self.view.$data.is_syncing = true;
            // display title of doc where possible
            if (doc && doc.hasOwnProperty("tt")) {
                self.view.$data.is_syncing = doc.tt;
            }
            setTimeout(function() {
                self.view.$data.is_syncing = false;
            }, 2000);
        }, 50);
    }

    /**
    * Get name of the lantern we're connected to and save for view
    **/
    function loadLanternName() {
        fetch(self.stor.lantern_uri + "/api/name").then(function(response) {
            return response.json();
        }).then(function(json) {
            self.view.$data.lantern_name = json.name;
        })
        .catch(function(err) {
            console.log(err);
        });
    }


    function sync(continuous) {

        self.view.$data.cloud_connected = self.stor.cloud_connected;
        self.view.$data.lantern_connected = self.stor.lantern_connceted;

        if (self.stor.lantern_connected) {
            loadLanternName();
        }


        if (window.location.host == "lantern.global" && !self.stor.cloud_connected) {
            self.view.$data.cloud_connected = true;
            self.stor.syncWithCloud(continuous, function(status) {
                self.view.$data.cloud_connected = true;
            }, function(changed_doc) {
                console.log(changed_doc);
                refreshCached(changed_doc);
                // showSyncIcon();
            });
        }
        else {


            if (self.stor.cloud_connected === null) {
                // check to see if we have cloud access before attempting sync
                // this could be blocked because we're offline or server is down
                fetch("https://lantern.global/api/id").then(function(res) {
                    if (res.status == 200) {
                        self.stor.syncWithCloud(continuous, function(status) {
                            self.view.$data.cloud_connected = status;
                        },function(changed_doc) {
                            console.log("[page] doc changed", changed_doc);
                            refreshCached(changed_doc);
                            showSyncIcon(changed_doc);
                        });
                    }
                }).catch(function(err) {
                    self.view.$data.cloud_connected = null;
                });
            }


            if (self.stor.lantern_connected === null) {

                // check to see if we have rpi access before attempting sync
                fetch(self.getBaseURI() + "/api/id").then(function(res) {
                    if (res.status == 200) {
                        self.stor.syncWithLantern(continuous, function(status) {
                            self.view.$data.lantern_connected = status;
                            if (status == true) {
                                loadLanternName();
                            }
                        },function(changed_doc) {
                            // don't display sync message for map cache
                            if (!changed_doc.dataUrl) {
                                showSyncIcon(changed_doc);
                            }
                        });
                    }
                }).catch(function(err) {
                    self.view.$data.lantern_connected = null;
                });
            }
        }
    }

    //------------------------------------------------------------------------
    /** 
    * Define helper for user interactions
    **/
    self.addHelper = function(name, fn) {
        opts.methods[name] = fn;
    };
    
    /** 
    * Define data for vue templates
    **/
    self.addData = function(name, val) {
        opts.data[name] = val;
    };

    /** 
    * Mount vue to our top-level document object
    **/
    self.render = function() {
        self.view = new Vue(opts);
        self.view.$mount(["#", id, "-page"].join(""));
        return Promise.resolve();
    };

    /**
    * Add in data from PouchDB and identify network status
    */
    self.connect = function() {
        self.stor = new LanternStor(opts.data, self.getBaseURI());
        return self.stor.setup()
            .then(getOrCreateUser)
            .then(function(user) {
                // make sure we have an anonymous user all the time
                self.user = user;
                var cached = self.stor.getCached(user.id);
                self.view.$data.user = cached;
                // device wifi or local testing
                sync(true);
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





    /**
    * Display the map for the user based on approx. location
    */
    // @todo handle re-render when new venues are selected
    self.renderMap = function(venues, show_tooltip, icon, color) {

        if (!self.map) {
            self.map = new LanternMapManager();
        }

        self.map.clear();

        venues = venues || [];


        return new Promise(function(resolve, reject) {

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
    };
    
    self.askForLocation = function() {
        return new Promise(function(resolve, reject) {
            console.log("[page] asking for location");
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

        // increase privacy
        geohash = geohash.substr(0,4);

        // tell device to use this as it's most recent location (skip GPS)
        if (self.getBaseURI() != "https://lantern.global") {
            fetch(self.getBaseURI() + "/api/geo",
            {
                method: "POST",
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
        }

        // update user document to include location
        console.log("[page] updating user location");
        self.user.push("geo", geohash);
        self.user.save();

    };



    /**
    * Points to the right server for processing requests
    */
    self.getBaseURI = function() {

        return window.location.protocol + "//" + (window.location.host == "localhost:3000" ? 
            "localhost" :  window.location.host);
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
    opts.data.showNavMenu = false;

    /**
    * Setup global view helpers
    */
    opts.methods.toggleNavigation = function(el) {
        self.view.$data.showNavMenu = !self.view.$data.showNavMenu;

        if (self.view.$data.showNavMenu) {
            self.getUsers();
        }
    };



    //------------------------------------------------------------------------
    return self;
});

