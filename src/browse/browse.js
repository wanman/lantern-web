window.page = (function() {

    var self = new LanternPage("browse");

    /**
    * Construct sample documents for demonstration purposes
    */
    function importSampleData() {
        var imp = new LanternImport(self.stor);
        imp.all();
    }


    /*
    * Make sure we have zones to work with
    */
    function loadZones() {
        self.stor.getManyByType("z").then(function(zones) {
            if (zones.length === 0) {
                // if we have zero zones, we probably are missing data
                console.log("[browse] importing sample data...");
                importSampleData();
                setTimeout(loadZones, 300);
            }
            else {
                //async load in tags we can use for reporting
                self.stor.getManyByType("t")
                    .then(function(tags) {
                        tags.forEach(function(tag) {
                            if (tag.has("tag", "z")) {
                                self.view.$data.zone_tags.push(tag.toJSONFriendly());
                            }
                        });
                    });
                    
                // cache items for future association with zones
                self.stor.getManyByType("i").then(function(items) {
                    self.view.$data.loaded = true;
                });

            }
        });
    }


    /**
    * Display the map for the user based on approx. location
    */
    function renderMap() {
        var map_mgr = new LanternMapManager();
        setTimeout(function() {
            self.view.$data.show_map = true;
        }, 2000);
    }

    //------------------------------------------------------------------------
    self.addData("zone_tags", []);
    self.addData("show_filter", false);
    self.addData("show_report", false);
    self.addData("show_zones", true);
    self.addData("show_map", false);
    self.addData("loaded", false);
    self.addData("network_status", -1);
    self.addData("prompt_for_map", false);



    //------------------------------------------------------------------------
    self.addHelper("handleToggleReportView", function() {
        self.view.$data.show_report = !self.view.$data.show_report;
        self.view.$data.show_zones = !self.view.$data.show_report;
    });

    self.addHelper("handleToggleFilterView", function() {
        self.view.$data.show_filter = !self.view.$data.show_filter;
    });

    self.addHelper("handleZoneSelect", function(zone) {
        console.log(zone);
    });

    self.addHelper("handleZoneTag", function(tag) {
        console.log("[browse] report a " + tag.title);
    });    

    self.addHelper("handleShowMap", renderMap);

    self.addHelper("handleCloseFilterView", function() {
        self.view.$data.show_filter = false;
    });

    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(loadZones)
        .then(function() {
            // auto-show map if permission granted
            if (navigator) {
                navigator.permissions.query({'name': 'geolocation'})
                    .then( function(permission) {
                        if (permission.state == "granted") {
                            renderMap();
                        }
                        else {
                            self.view.$data.prompt_for_map = true;
                        }
                    });
            }
            else {
                self.view.$data.prompt_for_map = false;
            }
        });

    return self; 
}());