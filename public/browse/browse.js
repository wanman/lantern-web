__base = "../";

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
    * Make sure we have markers to work with
    */
    function loadMarkers() {
        return self.stor.getManyByType("m").then(function(markers) {
            if (markers.length === 0) {
                // if we have zero markers, we probably are missing data
                console.log("[browse] importing sample data...");
                importSampleData();
                setTimeout(loadMarkers, 300);
            }
            else {
                console.log(markers);
                self.stor.getManyByType("c").then(function() {
                    // cache items for future association with markers
                    self.stor.getManyByType("i").then(function(items) {
                        self.view.$data.loaded = true;
                    });
                });

            }
        });
    }


    function askForLocation() {
        function geo_success(position) {
            console.log("[browse] found position", position);
            renderMap(position.coords.latitude, position.coords.longitude);
        }

        function geo_error(err) {
            console.log("[browse] no position available", err);
        }

        console.log("[browse] asking for location");
        var geo_options = {
          enableHighAccuracy: false, 
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
        if (map) {
            // already showing map
            return;
        }

        console.log("[browse] showing map");


        map = new LanternMapManager(lat, lon);
        map.setPosition(lat, lon);

        console.log("[browse] map loaded");

        // add markers to map
        self.view.$data.m_docs.forEach(function(marker) {
            var coords = [];
            for (var idx in marker.geo) {
                var c = Geohash.decode(marker.geo[idx]);
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

    }

    //------------------------------------------------------------------------

    self.addData("loaded", false);
    self.addData("show_map", null);
    self.addData("geolocation", null);



    //------------------------------------------------------------------------

    self.addHelper("handleItemSelect", function(item, marker) {
        window.location = "/detail/detail.html?mrk=" + marker._id + "&itm=" + item._id;
    });

    self.addHelper("handleMarkerSelect", function(marker) {
        window.location = "/detail/detail.html?mrk=" + marker._id;
    });


    self.addHelper("handleShowMap", function(evt) {
        self.view.$data.show_map = true;
        askForLocation();
    });

    self.addHelper("handleShowList", function(evt) {
        self.view.$data.show_map = false;
    });


    self.addHelper("getCategoryName", function(item) {
        var id = "c:" + item.category[0];
        return self.stor.getCached(id).title;
    });


    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            self.view.$data.page_title = "Nearby";
        })
        .then(self.connect)
        .then(loadMarkers);

    return self; 
}());
