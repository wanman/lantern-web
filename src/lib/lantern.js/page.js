window.LanternPage = (function(id) {

    var opts = {
        data: {},
        methods: {}
    };

    var self = {
        stor: null,
        user: null,
        view: null
    };


    // initialize arrays for each type of doc
    (["z", "i", "t", "r", "n", "u"]).forEach(function(type) {
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
            console.log("[user] found", doc.get("_id"));
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
    * Determine our level of network connection
    */
    self.getNetworkStatus = function() {
        return self.stor.isLanternAvailable()
            .then(function(lantern_available) {
                if (lantern_available) {
                    return "LNT";
                }
                else {
                    return self.stor.isCloudAvailable()
                        .then(function(cloud_available) {
                            if (cloud_available) {
                                return "ONL";
                            }
                            else {
                                return "OFL";
                            }
                        });
                }
            });
    };

    /**
    * Add in data from PouchDB and identify network status
    */
    self.connect = function() {
        
        var network_status = 0; // start with unknown status

        self.stor = new LanternStor(opts.data);
        return self.stor.setup()
            .then(self.getNetworkStatus)
            .then(function(network_status) {
                // update view with actual network status
                console.log("[page] network status = " + network_status);
                self.view.$data.network_status = network_status;
            })
            .then(getOrCreateUser)
            .then(function(user) {
                // make sure we have an anonymous user all the time
                self.user = user;
                var cached = self.stor.getCached(user.id);
                self.view.$data.user = cached;
            });
    };



    /**
    * Points to the right server for processing requests
    */
    self.makeURI = function(uri) {
        return "http://" + (window.location.host == "localhost:3000" ? 
            "localhost:8080" :  window.location.host);
    };



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
    };



    //------------------------------------------------------------------------
    return self;
});

