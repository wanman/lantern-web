window.page = (function() {

    var self = new LanternPage("browse");
    var map;

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
        return self.stor.getManyByType("z").then(function(zones) {
            if (zones.length === 0) {
                // if we have zero zones, we probably are missing data
                console.log("[browse] importing sample data...");
                importSampleData();
                setTimeout(loadZones, 300);
            }
            else {

                //async load in categories we can use for reporting
                self.stor.getManyByType("c")
                    .then(function(categories) {
                        categories.forEach(function(cat) {
                            if (cat.has("tag", "zne")) {
                                self.view.$data.zone_categories.push(cat.toJSONFriendly());
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


    function askForLocation() {

        function geo_success(position) {
            console.log("[browse] found position", position);
            renderMap(position.coords.latitude, position.coords.longitude);
        }

        function geo_error() {
            console.log("[browse] no position available");
        }

        console.log("[browse] asking for location");
        var geo_options = {
          enableHighAccuracy: true, 
          maximumAge        : 30000, 
          timeout           : 27000
        };

        navigator.geolocation.getCurrentPosition(geo_success, geo_error, geo_options);
        var wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);
    }


    /**
    * Display the map for the user based on approx. location
    */
    function renderMap(lat, lon) {
        if (self.view.$data.show_map) {
            // already showing map
            return;
        }

        console.log("[browse] showing map");
        self.view.$data.show_map = true;

        setTimeout(function() {

            map = new LanternMapManager(lat, lon);

            map.map.on("load", function() {

                console.log("[browse] map loaded");

                // add zones to map
                self.view.$data.z_docs.forEach(function(zone) {
                    var coords = [];
                    for (var idx in zone.geo) {
                        var c = Geohash.decode(zone.geo[idx]);
                        coords.push(c);
                    }

                    if (coords.length == 1) {
                        // point
                        map.addPoint(coords[0]);
                    }
                    else {
                        // draw a shape
                        map.addPolygon(coords);
                    }
                });

            });

        }, 300);

    }

    //------------------------------------------------------------------------
    self.addData("zone_categories", []);
    self.addData("show_filter", false);
    self.addData("show_report", false);
    self.addData("show_zones", true);
    self.addData("show_map", false);
    self.addData("loaded", false);
    self.addData("network_status", -1);
    self.addData("prompt_for_map", false);
    self.addData("geolocation", null);



    //------------------------------------------------------------------------
    self.addHelper("handleToggleReportView", function() {
        self.view.$data.show_report = !self.view.$data.show_report;
        self.view.$data.show_zones = !self.view.$data.show_report;
    });

    self.addHelper("handleToggleFilterView", function() {
        self.view.$data.show_filter = !self.view.$data.show_filter;
    });

    self.addHelper("handleItemSelect", function(item,zone) {
        console.log(item, zone);
    });

    self.addHelper("handleZoneCategory", function(cat) {
        console.log("[browse] report a " + cat.title);
    });    

    self.addHelper("handleShowMap", askForLocation);

    self.addHelper("handleCloseFilterView", function() {
        self.view.$data.show_filter = false;
    });

    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(loadZones)
        .then(function() {
            // auto-show map if permission granted
            if (navigator && navigator.geolocation) {
                if (!navigator.permissions) {
                    self.view.$data.prompt_for_map = true;
                }
                else {

                    navigator.permissions.query({'name': 'geolocation'})
                        .then( function(permission) {
                            if (permission.state == "granted") {
                                askForLocation();
                            }
                            else {
                                self.view.$data.prompt_for_map = true;
                            }
                        });
                }
            }
            else {
                self.view.$data.prompt_for_map = false;
            }
        });

    return self; 
}());