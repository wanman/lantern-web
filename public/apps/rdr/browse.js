__base = "../../";

window.page = (function() {

    var self = new LX.Page("browse");
    var vu;
    //------------------------------------------------------------------------  
    Array.prototype.getIndexForObjectWithKey = function(key, value) {
        for (var idx in this) {
            var item = this[idx];
            if (item.hasOwnProperty(key) && item[key] == value) {
               return idx;
            }
        }
    }



    //------------------------------------------------------------------------  
    function setTitleWithCategories() {
        vu.page_title = "Supplies";
        categories = self.getHashParameterByName("cat");
        if (categories) {
            var category_list = categories.split(",");
            if (category_list.length == 1) {
                self.stor.get("c:" + category_list[0]).then(function(doc) {
                    vu.page_title += " : " + doc.get("title");
                });
            }
            else {
                vu.page_title += " : Search";
            }
        }
    }

    function reflowView() {
        console.log("[rdr] reflow view");
        setTitleWithCategories();
        // default to map view
        if (self.getHashParameterByName("v") == "map") { 
            vu.show_map = true;
            vu.show_list = false;
            showMap();
        }
        else {
            vu.show_map = false;
            vu.show_list = true;
        }
        updateFilteredVenues();

        if (vu.show_map) {
            drawMarkers();
        }

    }

    /*
    * requestUserLocation
    *
    * Ensure we have a location-based context for user before we display any list or map results
    */
    function requestUserLocation() {
        var reuse_known_location = true;
        return LX.Location.getCurrentGeohash(reuse_known_location)
            .then(function(geo) {
                console.log("[rdr] my geo:", geo);
                vu.geo = geo;
                return reuse_known_location
            })
            .then(LX.Location.getCurrentPosition)
            .then(function(pos) {
                if (self.map) {
                    self.map.setOwnLocation({lat:pos.coords.latitude, lng:pos.coords.longitude});
                }
                return pos;
            })
            .catch(function(err) {
                console.log("geolocation unavailable");
                console.log(err);
            });
    }

    function getBestMarkerIcon(items) {
        var catfilter = self.getHashParameterByName("cat");

        if (catfilter) {
            catfilter = catfilter.split(',');
        }
        else {
            return items[0];
        }

        for (var idx in items) {
            var item = items[idx];
            if (item.category && catfilter.indexOf(item.category[0]) != -1) {
                return item;
            }
        }
        return items[0];
    }


    function drawMarker(venue, items) {

        if (items.length == 0) {
            // no items for this venue, so skip it
            // @todo consider showing all venues even if no supplies are there yet
            return;
        }


        var geo = Geohash.decode(venue.geo[0]);
        var top_item = getBestMarkerIcon(items);

        var category_doc = self.stor.getCached("c:"+top_item.category[0]);

        console.log("[rdr] draw marker: ", venue.title, geo, category_doc);
        var pt = self.map.addPoint(venue.title, geo, category_doc.icon, category_doc.style.color);
        pt.on("click", function(e) {
            window.location = "./detail.html#mrk=" + venue._id;
        });
        pt.openTooltip();
               
    }

    function drawMarkers() {
        console.log("[rdr] draw markers");
        
        var item_map = {};

        self.map.clear();

        // @todo optimize this with database query
        vu.i_docs.forEach(function(item) {
            var venue_id = item.parent[0]
            item_map[venue_id] = item_map[venue_id] || [];
            item_map[venue_id].push(item);
        });

        vu.filtered_venues.forEach(function(venue) {
            if (venue.geo) {
                var items = item_map[venue._id] || [];
                drawMarker(venue, items);
            }
        });

        self.map.fitAll();
    }

    function updateFilteredVenues() {
        console.log("[rdr] filtering venues");
    
        var catfilter = self.getHashParameterByName("cat");


        if (catfilter) {
            catfilter = catfilter.split(',');
            var matching_items = [];
            vu.i_docs.forEach(function(item) {
                var match_cat = item.category[0]

                if (catfilter.indexOf(match_cat) != -1) {
                    matching_items.push(item);
                }
            });

            var venues_with_categories = {};
            matching_items.forEach(function(item) {
                venues_with_categories[item.parent[0]] = true;
            });
        }

        var geofilter = self.getHashParameterByName("g");

        vu.v_docs.forEach(function(venue) {
            var is_match = true;

            if (catfilter) {
                if (!venues_with_categories[venue._id]) {
                    is_match = false;
                }
            }
          
            if (geofilter) {
                var match_geo = venue.geo[0];
                if (match_geo.indexOf(geofilter) == -1) {
                    //console.log("ignoring far away venue: " + venue._id);
                    is_match = false;
                }
            }


            var index = vu.filtered_venues.getIndexForObjectWithKey("_id", venue._id);

            if (!index) {
                if (is_match) {
                    vu.filtered_venues.push(venue);         
                }
            }
            else {
                if (is_match) {
                    // already added              
                }
                else {
                    // remove bad match
                    vu.filtered_venues.splice(index,1);
                }
            }

        });

        console.log("[rdr] final venue list", vu.filtered_venues);
    }

    
    function showMap() {
        console.log("[rdr] show map");
        if (!self.map) {
            self.map = new LX.Map("map", false, false);
            self.map.setDefaultPosition();
        }

    }



    //------------------------------------------------------------------------        
    self.addData("category", null);
    self.addData("show_map", false);
    self.addData("geo", null);
    self.addData("show_list", false);
    self.addData("filtered_venues", []);



    //------------------------------------------------------------------------
    self.addHelper("handleItemSelect", function(item, venue) {
        window.location = "./detail.html#mrk=" + venue._id + "&itm=" + item._id;
    });

    self.addHelper("handleVenueSelect", function(venue) {
        window.location = "./detail.html#mrk=" + venue._id;
    });


    self.addHelper("handleShowMap", function(evt) {
        var hash_str = window.location.hash.replace("list", "map");
        if (hash_str.indexOf("v=") == -1) {
            hash_str = uri + "&v=map";
        }
        window.location.hash = hash_str;
    });

    self.addHelper("handleShowList", function(evt) {
        var hash_str = window.location.hash.replace("map", "list");
        if (hash_str.indexOf("v=") == -1) {
            hash_str = uri + "&v=list";
        }
        window.location.hash = hash_str;
    });

    self.addHelper("getDistanceFromVenue", function(my_geo, venue) {
        if (venue.hasOwnProperty("geo") && typeof(venue.geo[0]) == "string") {
            var distance = LX.Location.getDistanceFrom(venue.geo[0]);
            return distance + "km";
        }
        else {
            console.log("[rdr] skip distance calc since venue missing geo", venue._id);
            return;
        }
    });

    self.addHelper("getItemsForVenue", function(venue) {
        var active_items = [];
        vu.i_docs.forEach(function(item) {

            var is_match = true;

            item.parent.forEach(function(parent) {
                if (parent[0] == "e") {
                    var event = self.stor.getCached(parent);
                    if (event.status && event.status == 3 ) {
                        is_match = false;
                    }
                }
                else {
                    if (venue._id != parent) {
                        is_match = false;
                    }
                }
            });


            if (is_match) {
                active_items.push(item);
            }

        });
        return active_items; 
    })

    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            vu = self.view;
            vu.page_title = "Supplies";
        })
        .then(self.connect)
        .then(setTitleWithCategories)
        .then(self.getCategories)
        .then(self.getItems)
        .then(self.getVenues)
        .then(self.getEvents)
        .then(reflowView)
        .then(function() { 
            window.onhashchange = reflowView;
            vu.page_loading = false;
        })
        .then(requestUserLocation)
        
       

    return self; 
}());

