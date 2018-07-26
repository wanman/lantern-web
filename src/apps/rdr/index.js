window.page = (function() {

    var self = new LanternPage("browse");
    var category_id;
    
    // geolocation options
    var geo_options = {
        enableHighAccuracy: false, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    function reflowView() {
        category_id = self.getHashParameterByName("cat");
        loadVenues().then(function() {
            if (self.getHashParameterByName("v") == "map") {
                showMap();
            }
            else if (self.getHashParameterByName("v") == "list") {
                showList();
            }
            else {
                self.view.$data.show_filters = false;
                self.view.$data.personalizing = false;
            }
        });
    }


    /*
    * Make sure we have venues to work with
    */
    function loadVenues() {
        return self.getVenues().then(function(venues) {

            return self.getCategories().then(function(categories) {

                // cache items for future association with venues
                return self.getItems().then(function(items) {

                    self.view.$data.item_categories = [];

                    categories.forEach(function(cat) {
                        if (cat.has("tag", "itm")) {
                            var data = cat.toJSONFriendly();
                            data.count = 0;

                            items.forEach(function(item) {
                                var categories = item.get("category") || [];

                                categories.forEach(function(cat) {

                                    if (item.id[2] == "v" && cat == data.slug) {
                                        data.count++;
                                    }
                                });
                            });

                            self.view.$data.item_categories.push(data);
                        }
                    });


                    self.view.$data.filtered_venues = [];


                    if (category_id) {
                        self.view.$data.page_title = "Supplies : " + 
                            self.stor.getCached("c:" + category_id).title;
                    }
                    else {
                        self.view.$data.page_title = "Supplies";
                    }

                    items.forEach(function(item) {
                        if (!category_id || item.has("category", category_id)) {
                            var venue = item.get("parent")[0];
                            if (venue && venue[0] == "v") {
                                self.view.$data.filtered_venues.push(venue);
                            }
                        }
                    });
                    self.view.$data.category = category_id;
                    self.view.$data.page_loading = false;
                });
            });
        });
    }



    /**
    * Update interface based on user's changing geolocation
    */
    function onLocationChange(position) {
        if (!position || !position.coords) return;
        self.geo = Geohash.encode(position.coords.latitude, position.coords.longitude, 7);
        console.log("[page] my geo", self.geo);
        self.map.setOwnLocation({lat:position.coords.latitude, lng:position.coords.longitude});
    }

    
    function showMap() {

        console.log("[rdr] show map");
        self.view.$data.show_map = true;
        self.view.$data.show_filters = false;
        var icon = null;
        var color = null;
        
        if (self.view.$data.category) {
            var cat = self.stor.getCached("c:" + self.view.$data.category);
            icon = cat.icon;
            color = cat.style.color;
        }   

  
        self.renderMap(self.view.$data.filtered_venues, true, icon, color)
            .then(function() {

                console.log("[rdr] rendering map");
                self.map.fitAll();

                self.askForLocation()
                    .then(function(res) {

                        self.geo = Geohash.encode(res.coords.latitude, res.coords.longitude, 7);
                        console.log("[rdr] my geo", self.geo);

                        self.sendGeohashToLantern(self.geo);

                        self.view.$data.geolocation = self.geo;
                        self.map.setOwnLocation({lat:res.coords.latitude, lng:res.coords.longitude});
                        self.map.fitAll();

                    })
                    .catch(function(err) {
                        console.log("[rdr] err fitting map", err);
                    });


            })
            .catch(function(err) {
                console.log("[rdr] map error", err);
            });
        
    }


    function showList() {
        console.log("[rdr] show list");
        self.view.$data.show_map = false;
        self.view.$data.show_filters = false;
        self.view.$data.personalizing = false;
    }


    //------------------------------------------------------------------------
        
    // filter view
    self.addData("item_categories", []);
    self.addData("selected_category", null);
    self.addData("personalizing", false);
    self.addData("last_sync_check", new Date());
    self.addData("show_filters", false);

    // map and list view
    self.addData("category", null);
    self.addData("filtered_venues", []);
    self.addData("show_map", null);
    self.addData("geolocation", null);




    //------------------------------------------------------------------------

    self.addHelper("handleActionButton", function() {
        console.log("[rdr] toggle page filter");
        if (self.view.$data.show_filters) {
            self.view.$data.show_filters = false;
        }
        else {
            self.view.$data.show_filters = true; 
        }
    });


    self.addHelper("handleCategorySelect", function(cat) {
        self.view.$data.personalizing = true;

        self.view.$data.selected_category = cat;
        self.view.$refs[cat.slug][0].classList.add("active");
        
        var cat_label = cat._id.substr(2, cat._id.length);

        console.log("[home] toggle cat: " + cat_label);
        // do optimistic UI updates and then listen for sync to confirm
        if (self.user.has("tag", cat_label)) {
            // self.user.pop("tag", cat_label);
        }
        else {
            self.user.push("tag", cat_label);
        }

        self.user.save()
            .then(function() {
                setTimeout(function() {
                    v = self.getHashParameterByName("v");
                    v = v || "list";
                    self.view.$data.personalizing = false;

                    window.location.hash = "#v=" + v + "&cat="+cat.slug;
                }, 1000);
            })
            .catch(function(err) {
                console.log(err);
            });
    });

    self.addHelper("handleAllCategorySelect", function() {

        v = self.getHashParameterByName("v");

        var str = "#";
        v = v || "list";
        str+="&v="+v+"&r="+Math.round(Math.random()*10);
        window.location.hash = str;
    });


    self.addHelper("makeBadgeStyle", function(cat) {
        if (!cat) return;
        var doc = new LanternDocument(cat, self.stor);
        var style = [];
        style.push("background-color: #" + doc.get("style", "color"));
        return style.join("; ");
    });



    self.addHelper("handleItemSelect", function(item, venue) {
        window.location = "./detail.html#mrk=" + venue._id + "&itm=" + item._id;
    });

    self.addHelper("handleVenueSelect", function(venue) {
        window.location = "./detail.html#mrk=" + venue._id;
    });


    self.addHelper("handleShowMap", function(evt) {

        cat = self.getHashParameterByName("cat");
        var str = window.location.origin + window.location.pathname + "#";
        if (cat) {
            str += "cat=" + cat;
        }
        window.location = str += "&v=map";
    });

    self.addHelper("handleShowList", function(evt) {

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
        if (venue.hasOwnProperty("geo") && typeof(venue.geo[0]) == "string") {
            var geo = venue.geo[0];
            if (!self.geo) {
                console.log("[rdr] skip distance calc since no user geo available", venue._id);
                return;
            }
            var distance = Math.round(Geohash.inKm(geo, self.geo));
            return distance + "km";
        }
        else {
            console.log("[rdr] skip distance calc since venue missing geo", venue._id);
            return;
        }

    });

    //------------------------------------------------------------------------

    window.onhashchange = reflowView;

    self.render()
        .then(function() {
            self.view.$data.page_title = "Supplies";
            self.view.$data.page_action_icon = "filter";

        })
        .then(self.connect)
        .then(reflowView);

    return self; 
}());
