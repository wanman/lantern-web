window.page = (function() {
    var self = new LanternPage("add");

    var map;
    var new_doc;
    var markers = [];

  


    function askForLocation(fn) {

        function geo_success(position) {
            console.log("[add] found position", position);
            renderMap(position.coords.latitude, position.coords.longitude);
            fn();
        }

        function geo_error() {
            console.log("[add] no position available");
        }

        console.log("[add] asking for location");
        var geo_options = {
          enableHighAccuracy: true, 
          maximumAge        : 30000, 
          timeout           : 27000
        };

        navigator.geolocation.getCurrentPosition(geo_success, geo_error, geo_options);
    }


    function renderMap(lat, lon) {
        console.log("[add] showing map");
        map = new LanternMapManager(lat, lon);
        map.setPosition(lat, lon, 12);
    }

    function setupMapSelector(tag, label) {
        console.log("[add] " + label + " form");
        new_doc.push("tag", "adr");
        console.log(new_doc);
        self.view.$data.show_input_selector = false;
        self.view.$data.show_subcategory_selector = false;
        self.view.$data.show_map_selector = true;
        askForLocation(function() {
            console.log("[add] map visible", map);
            var center = map.map.getCenter();

            if (tag != "ara") {

                markers.push(map.addPoint({lat: center.lat, lon: center.lng}, {
                    draggable: true
                }));
            }
            else {
                markers.push(map.addCircle({lat: center.lat, lon: center.lng},{
                    radius: 1000,
                    color: "#72A2EF",
                    fillColor: '#72A2E5',
                    opacity: 0.9,
                    draggable: true
                }));
            }


            if (tag == "lne") {
                markers.push(map.addPoint({lat: center.lat-0.01, lon: center.lng-0.01}, {
                    draggable: true
                }));
            }
        });
    }


    //------------------------------------------------------------------------
    self.addHelper("handleShowInputSelector", function(subcategory) {
        console.log(subcategory);
        new_doc.push("category", subcategory._id);
        
        self.view.$data.show_subcategory_selector = false;
        self.view.$data.show_input_selector = true;
    });

    self.addHelper("presentAddressForm", function() {
        setupMapSelector("adr", "address");
    });

    self.addHelper("presentAreaForm", function() {
        self.view.$data.area_radius = 1000;
        self.view.$watch("area_radius", function(new_val, old_val) {
            if (markers[0]) {
                markers[0].setRadius(new_val);
            }
        });
        setupMapSelector("ara", "area");

    });

    self.addHelper("presentLineForm", function() {
        setupMapSelector("lne", "line");
    });

    self.addHelper("handleButtonPush", function(evt) {
        evt.target.className="button is-primary is-loading";
        setTimeout(function() {

            if (self.view.$data.lock_doc) {
                // submit
                console.log("save", new_doc);
                new_doc.save().then(function() {
                    evt.target.className="button is-primary";
                    self.view.$data.show_map_selector = false;
                    self.view.$data.show_success = true;
                });
            }
            else {

                markers.forEach(function(marker) {
                    var coords = marker.getLatLng();
                    console.log(coords);
                    var hash = Geohash.encode(coords.lat, coords.lng, 10);
                    new_doc.push("geo", hash);
                    if (marker.getRadius) {
                        new_doc.set("radius", marker.getRadius());
                    }
                    self.view.$data.lock_doc = true;
                    map.setPosition(coords.lat, coords.lng, 10);
                    evt.target.className="button is-primary";

                });
            }
        }, 500);

    });

    self.addHelper("handleReturnToMap", function() {
        window.location = "/browse/browse.html";
    });
    

    self.addHelper("handleCancelReport", function() {
        window.history.go(-1);
    });

    self.addHelper("handleMarkerCategory", function(cat) {
        console.log("[browse] report a " + cat.title);
        window.location = "/add/add.html?ct="+cat._id;
    });    

    
    //------------------------------------------------------------------------
 
    self.addData("category", null);
    self.addData("subcategories", []);
    self.addData("marker_categories", []);
    self.addData("show_subcategory_selector", false);
    self.addData("show_report", false);
    self.addData("show_input_selector", false);
    self.addData("show_map_selector", false);
    self.addData("show_success", false);
    self.addData("area_radius", 0);
    self.addData("lock_doc", false); // for preview before saving

    //------------------------------------------------------------------------
    
    var param = self.getURIParameterByName("ct");

    self.render()
        .then(self.connect)
        .then(function() {
                
            if (!param) {

                //async load in categories we can use for reporting
                self.stor.getManyByType("c")
                    .then(function(categories) {
                        categories.forEach(function(cat) {
                            if (cat.has("tag", "mrk")) {
                                self.view.$data.marker_categories.push(cat.toJSONFriendly());
                                self.view.$data.show_report = true;
                            }
                        });
                    });
            }
            else {

                new_doc = new LanternDocument( "m:" + Math.round(Math.random()*100000), self.stor);
                new_doc.push("category", param);

                self.stor.get(param).then(function(result) {
                    console.log(result);
                    self.view.$data.category  = result.toJSONFriendly();
                    self.stor.getManyByType("c").then(function(results) {

                        results.forEach(function(cat) {
                            // find subcategories
                            if (cat.has("tag", param.split(":")[1])) {
                                self.view.$data.subcategories.push(cat.toJSONFriendly());
                            }
                        });  

                         if (self.view.$data.subcategories == 0 ) {
                            console.log("[add] no available subcategories for category:", param);
                            console.log("[add] skipping ahead to input selector...");
                            self.view.$data.show_input_selector = true;
                        }   
                        else {
                            self.view.$data.show_subcategory_selector = true;
                        }        
                    });
                });
            }
        });

    return self;
}());
