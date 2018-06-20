window.page = (function() {
    var self = new LanternPage("detail");

    var marker_id = self.getURIParameterByName("mrk");
    var item_id = self.getURIParameterByName("itm");

    if (!marker_id) {
        window.location = "/";
        return;
    }

    function focusMap() {
        console.log("[detail] showing map");
        if (self.view.$data.marker) {
            var coords = Geohash.decode(self.view.$data.marker.geo[0]);
            self.map.setPosition(coords.lat, coords.lon, 12);
        }
    }

    //------------------------------------------------------------------------
    self.addData("show_map", true);
    self.addData("show_inspector", false);
    self.addData("marker", {});
    self.addData("selected_item", {});


    //------------------------------------------------------------------------
    self.addHelper("makeItemStyle", function(item) {
        var category = self.stor.getCached("c:"+item.category[0]);
        var style = "border-color: #" +  category.style["color"];
        if (item._id == self.view.$data.selected_item._id) {
            style += "; border-width: 2px;";
        }
        return style;
    });

    self.addHelper("handleSelectItem", function(item) {
        self.view.$data.selected_item = item;
        self.view.$data.show_inspector = true;
    });

    self.addHelper("clearSelectItem", function() {
        self.view.$data.selected_item = {};
        self.view.$data.show_inspector = false;
    });


    self.addHelper("handleShowMap", function(evt) {
        self.view.$data.show_map = true;
        setTimeout(function() {
            self.renderMap().then(focusMap);
        }, 100);
    });

    // @todo use actual verifications
    self.addHelper("makeVerifications", function(item) {
        return Math.round(Math.random()*10);
    });

    self.addHelper("countVotes", function(item) {
        var count = 0;
        if (item.hasOwnProperty("vote")) {
            for (var idx in item.vote) {
                count += item.vote[idx].votes;
            }
        }
        return count;
    });
    
    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(function() {
            self.view.$data.allow_back_button = true;

            return self.stor.getManyByType("c");
        })
        .then(function() {
            return self.stor.getManyByType("i");
        })
        .then(function() {
            console.log("[detail]", marker_id);

            self.stor.get(marker_id).then(function(doc) {
                // make sure we have a most recent timestamp to work with
                if (!doc.has("updated_at")) {
                    if (doc.has("created_at")){
                        doc.set("updated_at", doc.get("created_at"));
                    }
                    else if (doc.has("imported_at")){ 
                        doc.set("updated_at", doc.get("imported_at"));
                    }
                }
                self.view.$data.marker = doc.toJSONFriendly();
                self.view.$data.page_title = doc.get("title");

                if (doc.get("status") == 1) {
                    self.view.$data.page_tag = "Open";
                }


                self.renderMap([marker_id]).then(focusMap);


            })
            .catch(function(err) {
                console.log("[detail] could not get: " + marker_id, err);
            });

            if (item_id) {
                self.stor.get(item_id).then(function(doc) {
                    self.view.$data.selected_item = doc.toJSONFriendly();
                    self.view.$data.page_loading = false;
                })
                .catch(function(err) {
                    console.log("[detail] could not get: " + item_id, err);
                });
            }
            else {
                self.view.$data.page_loading = false;
            }
        });

    return self;
})();