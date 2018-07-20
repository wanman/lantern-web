__base = "../";

window.page = (function() {

    var self = new LanternPage("browse");

    var category_id = self.getHashParameterByName("cat");

    /**
    * Construct sample documents for demonstration purposes
    */
    function importSampleData() {
        var imp = new LanternImport(self.stor);
        imp.all();
    }


    /*
    * Make sure we have venues to work with
    */
    function loadVenues() {

        return self.stor.getManyByType("v").then(function(venues) {
            if (venues.length === 0) {
                // if we have zero venues, we probably are missing data
                console.log("[browse] importing sample data...");
                importSampleData();
                setTimeout(loadVenues, 300);
            }
            else {
                self.stor.getManyByType("c").then(function() {
                    // cache items for future association with venues
                    self.stor.getManyByType("i").then(function(items) {

                        if (category_id) {
                            self.view.$data.page_title = "Places : " + 
                                self.stor.getCached("c:" + category_id).title;
                        }
                        items.forEach(function(item) {
                            if (!category_id || item.has("category", category_id)) {
                                var venue = item.get("parent")[0];
                                if (venue[0] == "v") {
                                    self.view.$data.filtered_venues.push(venue);
                                }
                            }
                        });

                        self.view.$data.category = category_id;
                        self.view.$data.page_loading = false;
                    });
                });

            }
        });
    }

    function showMap() {
        self.view.$data.show_map = true;

       
        if (!self.map || !self.map.user) {
            self.askForLocation()
                .then(function(res) {
                    console.log("[browse] my geo", Geohash.encode(res.coords.latitude, res.coords.longitude,6));
                    self.map.setOwnLocation({lat:res.coords.latitude, lng:res.coords.longitude});
                    self.map.fitAll();
                })
                .catch(function(err) {
                    console.log("[browse] err fitting map", err);
                });
        }

        setTimeout(function() {

            var icon = null;
            var color = null;
            
            if (self.view.$data.category) {
                var cat = self.stor.getCached("c:" + self.view.$data.category);
                icon = cat.icon;
                color = cat.style.color;
            }
            
            self.renderMap(self.view.$data.filtered_venues, true, icon, color)
                .then(function() {
                    self.map.fitAll();
                })
                .catch(function(err) {
                    console.log("[browse] map error", err);
                });
        }, 100);
    }


    //------------------------------------------------------------------------
    self.addData("category", null);
    self.addData("filtered_venues", []);
    self.addData("show_map", null);
    self.addData("geolocation", null);



    //------------------------------------------------------------------------

    self.addHelper("handleItemSelect", function(item, venue) {
        window.location = "/detail/detail.html#mrk=" + venue._id + "&itm=" + item._id;
    });

    self.addHelper("handleVenueSelect", function(venue) {
        window.location = "/detail/detail.html#mrk=" + venue._id;
    });


    self.addHelper("handleShowMap", function(evt) {

        cat = self.getHashParameterByName("cat");
        var str = window.location.origin + window.location.pathname + "#";
        if (cat) {
            str += "cat=" + cat;
        }
        window.location = str += "&v=map";
        
        showMap();
    });

    self.addHelper("handleShowList", function(evt) {
        self.view.$data.show_map = false;

        cat = self.getHashParameterByName("cat");
        var str = window.location.origin + window.location.pathname + "#";
        if (cat) {
            str += "cat=" + cat;
        }
        window.location = str += "&v=list";

    });


    self.addHelper("getCategoryName", function(item) {
        var id = "c:" + item.category[0];
        var category = self.stor.getCached(id);
        if (category) {
            return category.title;
        }
    });


    self.addHelper("getDistanceFromVenue", function(venue) {
        var distance = 1 + Math.round(Math.random()*5);
        return distance + "km";
    });

    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            self.view.$data.page_title = "Places";
        })
        .then(self.connect)
        .then(loadVenues)
        .then(function() {
            if (self.getHashParameterByName("v") == "map") {
                showMap();
            }
        });

    return self; 
}());

