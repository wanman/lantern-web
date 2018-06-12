window.page = (function() {

    var self = new LanternPage("browse");


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
                self.stor.getManyByType("c").then(function() {
                    // cache items for future association with markers
                    self.stor.getManyByType("i").then(function(items) {
                        self.view.$data.page_loading = false;
                    });
                });

            }
        });
    }


    //------------------------------------------------------------------------

    self.addData("show_map", null);
    self.addData("map_err", null);
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
        self.renderMap()
            .then(self.askForLocation)
            .then(function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                self.map.setPosition(lat, lon);
            });
    });

    self.addHelper("handleShowList", function(evt) {
        self.view.$data.show_map = false;
    });


    self.addHelper("getCategoryName", function(item) {
        var id = "c:" + item.category[0];
        var category = self.stor.getCached(id);
        if (category) {
            return category.title;
        }
    });


    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            self.view.$data.page_title = "Home";
        })
        .then(self.connect)
        .then(loadMarkers);

    return self; 
}());