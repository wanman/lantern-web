__base = "../../";

window.page = (function() {

    var self = new LX.Page("add");
    var new_doc;
    var venues = [];



    //------------------------------------------------------------------------
    function drawAtPosition(lat, lon, tag) {
        
        self.view.$data.map_loaded = true;

        if (tag == "adr") {
            venues.push(self.map.addPoint(new_doc.get("title"), {lat: lat, lon: lon}, "flag", null, true));
        }
        else if (tag == "ara") {
            var circle = self.map.addCircle(new_doc.get("title"), {lat: lat, lon: lon},{
                radius: self.view.$data.area_radius,
                color: "#72A2EF",
                fillColor: '#72A2E5',
                opacity: 0.9,
                draggable: true
            });

            venues.push(circle);
        }
        else if (tag == "lne") {
            venues.push(self.map.addPoint(new_doc.get("title"), {lat: lat, lon: lon}, "arrow-circle-left", null, true));
            venues.push(self.map.addPoint(new_doc.get("title"), {lat: lat-0.01, lon: lon-0.1}, "arrow-circle-right", null, true));
        }
    }

    function setupMapSelector(tag, label) {
        console.log("[add] " + label + " form - " + tag);
        window.location.hash = window.location.hash + "&tag="+tag;
    }

    function setCategory(id) {
        console.log("[add] setting category to: " + id);

        self.view.$data.lock_doc = false;
        new_doc.push("tag", id);

        self.stor.get("c:"+id).then(function(result) {
            self.view.$data.category  = result.toJSONFriendly();
            self.view.$data.page_title = result.get("title");

            self.stor.getManyByType("c").then(function(results) {
                results.forEach(function(cat) {
                    // find subcategories
                    if (cat.has("tag", id)) {
                        self.view.$data.subcategories.push(cat.toJSONFriendly());
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



        self.view.$data.allow_back_button = (window.location.hash ? true : false);

        cat_id = self.getHashParameterByName("ct");
        venues = [];

        self.view.$data.subcategories = [];

        if (!new_doc) {
            // we're creating a geo-scoped note for the community shared map
            new_doc = new LX.Document( "n:" + Math.round(Math.random()*100000), self.stor);
        }
        var tag = self.getHashParameterByName("tag");
        if (tag) {
            new_doc.push("tag", tag);


            if (tag == "ara") {
                self.view.$data.area_radius = 50000;
                self.view.$watch("area_radius", function(new_val, old_val) {
                    if (venues[0]) {
                        venues[0].setRadius(new_val);
                    }
                });
            }
            else {

                self.view.$data.area_radius = 0;
            }


            self.view.$data.view = "map";
            setTimeout(function() {
                self.renderMap()
                    .then(LX.Location.getCurrentPosition)
                    .then(function(position) {
                        var lat = position.coords.latitude;
                        var lon = position.coords.longitude;
                        self.map.setPosition(lat, lon, 4);
                        drawAtPosition(lat, lon, tag);
                    })
                    .catch(function(err) {
                        console.log(err);
                        // handle case where we cannot get location
                        self.map.setDefaultPosition();
                        var center_default = self.map.map.getCenter();
                        drawAtPosition(center_default.lat, center_default.lng, tag);
                        console.log("[add] err setting map selector", err);
                    });
            }, 200);
        }
        else if (cat_id) {
            setCategory(cat_id);
        }
        else {
            self.view.$data.view = "report";
            self.view.$data.page_title = "Report";
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
        self.view.$data.page_title =  subcategory.title;
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


    self.addHelper("handleAddSafeArea", function() {
        console.log("[add] add safe area...");
    });

    self.addHelper("presentAddressForm", function() {
        setupMapSelector("adr", "address");
    });

    self.addHelper("presentAreaForm", function() {
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
                    self.map.addZoomControl();
                });
            }
            else {

                venues.forEach(function(venue) {
                    var coords = venue.getLatLng();
                    var hash = Geohash.encode(coords.lat, coords.lng, 6);
                    new_doc.push("geo", hash);
                    if (venue.getRadius) {
                        new_doc.set("radius", venue.getRadius());
                    }
                    self.view.$data.lock_doc = true;
                    self.map.removeZoomControl();
                    evt.target.className="button is-primary";

                });
            }
        }, 500);

    });

    self.addHelper("handleReturnToMap", function() {
        window.location = "/";
    });
    

    self.addHelper("handleCancelReport", function() {
        window.history.go(-1);
    });

    self.addHelper("handleVenueCategory", function(cat) {
        console.log("[browse] report a " + cat.title);
        var id = cat._id.replace("c:", "");
        window.location.hash = "#ct="+id;
    });    

    

    //------------------------------------------------------------------------
    self.addData("category", null);
    self.addData("subcategories", []);
    self.addData("venue_categories", []);
    self.addData("view", "");
    self.addData("map_loaded", false);
    self.addData("area_radius", 50000);
    self.addData("lock_doc", false); // for preview before saving



    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(self.getCategories)
        .then(function(categories) {
            if (categories.length == 0 ) {
                window.location = "/";
            }
        })
        .then(refreshView);
    
    window.onhashchange = refreshView;

    return self;
}());

// support Bulma Slider
(function(){'use strict';function a(a){for(var b=a.id,c=document.getElementsByTagName('output'),d=0;d<c.length;d++)if(c[d].htmlFor==b)return c[d]}function b(a){var b,c,d=window.getComputedStyle(a,null),e=parseInt(d.getPropertyValue('width'),10);c=a.getAttribute('min')?a.getAttribute('min'):0;var f=(a.value-c)/(a.getAttribute('max')-c);return b=0>f?0:1<f?e:e*f,{position:b+'px'}}document.addEventListener('DOMContentLoaded',function(){var c=document.querySelectorAll('input[type="range"].slider');[].forEach.call(c,function(c){var d=a(c);if(d){if(c.classList.contains('has-output-tooltip')){var e=b(c);d.style.left=e.position}c.addEventListener('input',function(a){if(a.target.classList.contains('has-output-tooltip')){var c=b(a.target);d.style.left=c.position}var e=d.hasAttribute('data-prefix')?d.getAttribute('data-prefix'):'',f=d.hasAttribute('data-postfix')?d.getAttribute('data-postfix'):'';d.value=e+a.target.value+f})}})})})();
