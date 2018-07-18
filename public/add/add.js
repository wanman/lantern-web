__base = "../";

window.page = (function() {
    var self = new LanternPage("add");

    var new_doc;
    var venues = [];

    function setupMapSelector(tag, label) {
        console.log("[add] " + label + " form");
        new_doc.push("tag", "adr");

        self.view.$data.view = "map";


        setTimeout(function() {

            self.renderMap()
                .then(self.askForLocation)
                .then(function(position) {
                    
                    self.view.$data.map_loaded = true;

                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;
                    self.map.setPosition(lat, lon, 12);

                    if (tag != "ara") {
                        venues.push(self.map.addPoint(new_doc.get("title"), {lat: lat, lon: lon}, {
                            draggable: true
                        }));
                    }
                    else {
                        venues.push(self.map.addCircle(new_doc.get("title"), {lat: lat, lon: lon},{
                            radius: 1000,
                            color: "#72A2EF",
                            fillColor: '#72A2E5',
                            opacity: 0.9,
                            draggable: true
                        }));
                    }


                    if (tag == "lne") {
                        venues.push(self.map.addPoint(new_doc.get("title"), {lat: lat-0.01, lon: lon-0.01}, {
                            draggable: true
                        }));
                    }
                });

        }, 200);
            
    }

    function setCategory(id) {
        console.log("[add] setting category to: " + id);


        new_doc = new LanternDocument( "m:" + Math.round(Math.random()*100000), self.stor);
        new_doc.set("title", "New Place " + Math.round(Math.random()*100));
        new_doc.push("tag", id);

        self.stor.get("c:"+id).then(function(result) {
            self.view.$data.category  = result.toJSONFriendly();
            self.view.$data.page_title = "Report " + result.get("title");
            self.view.$data.allow_back_button = true;

            self.stor.getManyByType("c").then(function(results) {
                results.forEach(function(cat) {
                    if (result.id == "c:sup") {
                        // special case for supplies
                        if (cat.has("tag", "itm")) {
                            self.view.$data.subcategories.push(cat.toJSONFriendly());
                        }
                    }
                    else {
                        // find subcategories
                        if (cat.has("tag", id)) {
                            self.view.$data.subcategories.push(cat.toJSONFriendly());
                        }
                    }
                    
                });  

                 if (self.view.$data.subcategories == 0 ) {
                    console.log("[add] no available subcategories for category:", id);
                    console.log("[add] skipping ahead to input selector...");
                    self.view.$data.view = "input";
                }   
                else {
                    self.view.$data.view = "subcategory";
                }        
            });
        });
    }

    function refreshView() {
        cat_id = self.getHashParameterByName("ct");

        self.view.$data.subcategories = [];

        if (cat_id) {
            setCategory(cat_id);
        }
        else {
            self.view.$data.view = "report";
            self.view.$data.page_title = "Contribute";
            self.view.$data.venue_categories = [];
            
            //async load in categories we can use for reporting
            self.stor.getManyByType("c")
                .then(function(categories) {
                    categories.forEach(function(cat) {
                        if (cat.has("tag", "mrk")) {
                            self.view.$data.venue_categories.push(cat.toJSONFriendly());
                            self.view.$data.view = "report";
                        }
                    });
                });
        }

    }

    //------------------------------------------------------------------------
    self.addHelper("handleShowInputSelector", function(subcategory) {
        console.log("[add] selected subcategory: " + subcategory.title);
        self.view.$data.page_title = "Report " + subcategory.title;
        new_doc.push("category", subcategory._id.split(":")[1]);



        // supply locations get special treatment, as they must be connected
        // to a pre-defined venue
        if (new_doc.has("tag", "sup")) {
            self.getVenues().then(function(data) {
                self.view.$data.view = "venue";
            });
        }
        else {
            self.view.$data.view = "input";

        }
    });

    self.addHelper("handleSelectVenueForItem", function(venue) {
        console.log("[add] selected venue", venue, new_doc);

        new_doc.id = "i:" + new_doc.get("category") + "-" + Math.round(Math.random()*100);
        new_doc.set("title", "Supply");
        new_doc.set("status", 1);
        new_doc.push("parent", venue._id);
        new_doc.set("$ia", new Date());
        new_doc.save().then(function() {
            self.view.$data.view = "success";
        });
    });

    self.addHelper("handleAddSafeArea", function() {
        console.log("[add] add safe area...");
    });

    self.addHelper("presentAddressForm", function() {
        setupMapSelector("adr", "address");
    });

    self.addHelper("presentAreaForm", function() {
        self.view.$data.area_radius = 1000;
        self.view.$watch("area_radius", function(new_val, old_val) {
            if (venues[0]) {
                venues[0].setRadius(new_val);
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
                    self.view.$data.view = "success";
                });
            }
            else {

                venues.forEach(function(venue) {
                    var coords = venue.getLatLng();
                    var hash = Geohash.encode(coords.lat, coords.lng, 10);
                    new_doc.push("geo", hash);
                    if (venue.getRadius) {
                        new_doc.set("radius", venue.getRadius());
                    }
                    self.view.$data.lock_doc = true;
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

    self.addHelper("handleVenueCategory", function(cat) {
        console.log("[browse] report a " + cat.title);
        var id = cat._id.replace("c:", "");
        window.location = "/add/add.html#ct="+id;
    });    

    
    //------------------------------------------------------------------------
 
    self.addData("category", null);
    self.addData("subcategories", []);
    self.addData("venue_categories", []);
    self.addData("view", "report");
    self.addData("map_loaded", false);
    self.addData("area_radius", 0);
    self.addData("lock_doc", false); // for preview before saving

    //------------------------------------------------------------------------
    

    self.render()
        .then(self.connect)
        .then(refreshView);
    
    window.onhashchange = refreshView;

    return self;
}());

