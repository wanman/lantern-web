window.page = (function() {

    var self = new LanternPage("browse");


    /**
    * Construct sample documents for demonstration purposes
    */
    function importSampleData() {
        var imp = new LanternImport(self.stor);
        imp.all();
        self.view.$data.loading = 20;
    }

    /*
    * Adjust progress bar
    */
    function loadProgress(inc) {
        self.view.$data.loaded += inc;
    }

    /*
    * Make sure we have zones to work with
    */
    function loadZones() {
        self.stor.getManyByType("z").then(function(zones) {
            if (zones.length === 0) {
                // if we have zero zones, we probably are missing data
                importSampleData();
                setTimeout(loadZones, 300);
            }
            else {
                self.stor.getManyByType("c").then(function(categories) {
                    addManyCategoriesToView(categories, self.view);
                    self.stor.getManyByType("i").then(function(items) {
                        addManyZonesToView(zones, items, self.view);
                    });
                });
            }
        });
    }

    function addManyCategoriesToView(categories, view) {
        categories.forEach(function(category) {
            view.$data.categories.push(category.toJSONFriendly());
        });
    }

    /**
    * Nesting items within zones with friendly JSON
    */
    function addManyZonesToView(zones, items, view) {
        zones.forEach(function(zone) {
            // does the item have a parent that is the zone?
            items.forEach(function(item) {
                if (item.get("parent") == zone.get("_id")) {
                    // keep a child array within the zone object
                    zone.push("child", item.toJSONFriendly());
                }
            });
            view.$data.zones.push(zone.toJSONFriendly());
        });
    }



    //------------------------------------------------------------------------
    self.addData("zones", []);
    self.addData("categories", []);
    self.addData("show_filter", false);
    self.addData("show_report", false);
    self.addData("show_zones", true);
    self.addData("loaded", 0);



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

    self.addHelper("toggleCategory", function(evt) {
        var el = evt.target;
        var cat = el.getAttribute("id");
        console.log("[browse] clicked: " + cat);

        // do optimistic UI updates and then listen for sync to confirm
        if (self.user.has("tag", cat)) {
            self.user.pop("tag", cat);
            el.classList.remove("active");
        }
        else {
            el.classList.add("active");
            self.user.push("tag", cat);
        }
        self.user.save();
    });

    self.addHelper("makeCategoryClass", function(cat) {
        var cls = "";
        var user = self.user;
        if (user && user.has("tag", cat._id)) {
            cls += "active ";
        }
        return cls;
    });


    self.addHelper("makeCategoryStyle", function(cat) {
        var obj;

        if (!cat) {
            return;
        }

        if (typeof(cat) == "string") {
            obj = self.stor.getCached(cat);
        }
        else {
            obj = cat;
        }

        if (obj.hasOwnProperty("parent")) {
            // must be a specific supply
            obj = self.stor.getCached(obj.tag[0]);
        }

        var doc = new LanternDocument(obj, self.stor);
        var style = ["color: #" + doc.get("style","color")];
        style.push("background-color: #" + doc.get("style", "background-color"));
        style.push("border-color: #" + doc.get("style", "color"));
        return style.join("; ");
    });

    self.addHelper("handleReportSupply", function() {
        console.log("[report] report a supply");
    });    

    self.addHelper("handleReportShelter", function() {
        console.log("[report] report a shelter");
    });

    self.addHelper("handleReportCondition", function() {
        console.log("[report] report a condition");
    });


    self.addHelper("handleCloseFilterView", function() {
        self.view.$data.show_filter = false;
    });

    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(function() {
            // display progress bar
            var iv = setInterval(function() {
                loadProgress(3);
                if (self.view.$data.loaded >= 100) {
                    clearInterval(iv);
                }
            }, 20);
        })
        .then(loadZones);

    return self; 
}());