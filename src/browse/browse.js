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
                console.log("[browse] importing sample data...");
                importSampleData();
                setTimeout(loadZones, 300);
            }
            else {
                // cache items for future association with zones
                self.stor.getManyByType("i").then(function(items) {

                    items.forEach(function(item) {
                        self.view.$data.items.push(item.toJSONFriendly());
                    });

                    zones.forEach(function(zone) {
                        self.view.$data.zones.push(zone.toJSONFriendly());
                        self.view.$data.loaded = 100;
                    });
                });

            }
        });
    }




    //------------------------------------------------------------------------
    self.addData("zones", []);
    self.addData("items", []);
    self.addData("show_filter", false);
    self.addData("show_report", false);
    self.addData("show_zones", true);
    self.addData("loaded", 0);
    self.addData("network_status", -1);



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