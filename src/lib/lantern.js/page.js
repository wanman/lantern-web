window.LanternPage = (function(id) {

    // view options
    var opts = {
        data: {
            cloud_connected: null,
            lantern_connected: null,
            page_title: "",
            page_tag: "",
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
        stor: null,
        user: null,
        view: null,
        map: null
    };


    // initialize arrays for each type of doc
    // only these document types will ever be accepted by the system
    (["m", "i", "c", "r", "n", "u", "d"]).forEach(function(type) {
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
        doc.set("title", "User");
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
        setTimeout(function() {
            if (self.view.$data.is_syncing) return;
            self.view.$data.is_syncing = true;
            console.log(doc);
            // display title of doc where possible
            if (doc && doc.hasOwnProperty("tt")) {
                self.view.$data.is_syncing = doc.tt;
            }
            setTimeout(function() {
                self.view.$data.is_syncing = false;
            }, 4000);
        }, 50);
    }


    function sync(continuous) {

        self.view.$data.cloud_connected = self.stor.cloud_connected;
        self.view.$data.lantern_connected = self.stor.lantern_connected;

        if (window.location.host == "lantern.global") {
            self.view.$data.cloud_connected = true;
            self.stor.syncWithCloud(continuous, function(status) {
                self.view.$data.cloud_connected = true;
            }, function(changed_doc) {
                // showSyncIcon();
            });
        }
        else {
            self.stor.syncWithCloud(continuous, function(status) {
                self.view.$data.cloud_connected = status;
            },function(changed_doc) {
                showSyncIcon(changed_doc);

            });

            self.stor.syncWithLantern(continuous, function(status) {
                self.view.$data.lantern_connected = status;
            },function(changed_doc) {
                // don't display sync message for map cache
                if (!changed_doc.dataUrl) {
                    showSyncIcon(changed_doc);
                }
            });
        }
    }

    /**
    * Update interface based on user's changing geolocation
    */
    function onLocationChange(position) {
        console.log("[page] my geo", position.coords.latitude, position.coords.longitude);
        self.map.setOwnLocation({lat:position.coords.latitude, lng:position.coords.longitude});
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


    self.getMarkers = function() {
        return self.stor.getManyByType("m");
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
    self.renderMap = function(markers, show_tooltip, icon, color) {

        markers = markers || [];

        return new Promise(function(resolve, reject) {

            if (self.map) {
                return resolve();
            }

            // show my own location on the map
            var wpid = navigator.geolocation.watchPosition(onLocationChange, function(err) {
                console.log("[page] geo err", err);
            }, geo_options);


            var marker_options = {};
            self.getItems().then(function(items) {
                
                items.forEach(function(item){
                    var m = item.get("parent")[0];
                    var c_doc = "c:"+item.get("category")[0];
                    marker_options[m] = marker_options[m] || [];
                    marker_options[m].push(self.stor.getCached(c_doc));
                });
            
                self.map = new LanternMapManager();
                // add markers to map

                markers.forEach(function(m_id) {
                    var coords = [];
                    var marker = self.stor.getCached(m_id);
                    
                    for (var idx in marker.geo) {
                        var c = Geohash.decode(marker.geo[idx]);
                        coords.push(c);
                    }

                    if (coords.length == 1) {
                        // point
                        var final_icon = icon || marker_options[marker._id][0].icon;
                        var final_color = color || marker_options[marker._id][0].style.color;
                        var pt = self.map.addPoint(marker.title, coords[0], final_icon, final_color);
                       

                        if (show_tooltip) {
                            
                            pt.on("click", function(e) {
                                window.location = "/detail/detail.html#mrk=" + m_id;
                            });

                            pt.openTooltip();
                        }

                    }
                    else {
                        // draw a shape
                        self.map.addPolygon(marker.title, coords);
                    }
                });
                resolve(self.map);

            });
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
    * Points to the right server for processing requests
    */
    self.getBaseURI = function() {
        return "https://" + (window.location.host == "localhost:3000" ? 
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

