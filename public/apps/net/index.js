__base = "../../";

window.page = (function() {
    var self = new LanternPage("network");


    var tag_tally = {};


    self.addData("needs", 0);

    self.addHelper("handleInspectDevices", function() {
        self.view.$data.d_docs.forEach(function(doc) {
            console.log(JSON.stringify(doc));
        });
    });

    self.addHelper("getActiveHostCount", function() {
        var count = 0;
        self.view.$data.d_docs.forEach(function(doc) {
            if (doc.status == 1) {
                count++;
            }
        });
        return count;
    })


    self.addHelper("handleInspectUsers", function() {
        self.view.$data.u_docs.forEach(function(doc) {
            console.log(JSON.stringify(doc));
        });
    });

    self.addHelper("handleInspectSearches", function() {
        console.log(tag_tally);
    });

    self.addHelper("handleInspectNotes", function() {
        self.view.$data.n_docs.forEach(function(doc) {
            console.log(JSON.stringify(doc));
        });
    });


    self.addHelper("handleInspectVenues", function() {
        self.view.$data.v_docs.forEach(function(doc) {
            console.log(JSON.stringify(doc));
        });
    });


    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(self.getDevices)
        .then(function(devices) {
            if (devices.length == 0 ) {
                window.location = "/";
            }
        })
        .then(self.getNotes)
        .then(self.getVenues)
        .then(self.getItems)
        .then(self.getRoutes)
        .then(self.getUsers)
        .then(function(users) {
            users.forEach(function(user) {
                if (user.has("tag")) {
                    var tags = user.get("tag");
                    tags.forEach(function(tag) {
                        tag_tally[tag] = tag_tally[tag] || 0;
                        tag_tally[tag]++; 
                        self.view.$data.needs++;
                    });
                }
            });
            self.view.$data.page_title = "Network";
            self.view.$data.page_loading = false;

            setTimeout(function() {
                self.createMapManager().then(function() {
                    self.view.$data.d_docs.forEach(function(d) {
                        try {
                            var coords = Geohash.decode(d.geo[0]);
                            var pt = self.map.addPoint(d.title, coords, "server", "3273dc");                        
                        }
                        catch(err) {
                            // if we can't find a valid geohash we omit from map, which is fine...
                        }
                    });
                    self.map.fitToMarkers();
                    self.map.map.setZoom(4);
                });
            }, 100);        
        });
    return self;
})();
