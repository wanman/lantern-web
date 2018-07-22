window.page = (function() {
    var self = new LanternPage("detail");

    var venue_id = self.getHashParameterByName("mrk");
    var item_id = self.getHashParameterByName("itm");
    var venue_title;

    if (!venue_id) {
        window.location = "/";
        return;
    }

    function focusMap() {
        //console.log("[detail] showing map");
        if (self.view.$data.marker) {
            var coords = Geohash.decode(self.view.$data.marker.geo[0]);
            self.map.setPosition(coords.lat, coords.lon, 12);
        }
    }

    //------------------------------------------------------------------------
    self.addData("show_map", true);
    self.addData("show_inspector", false);
    self.addData("show_input", false);
    self.addData("marker", {});
    self.addData("item_types", []);
    self.addData("selected_item", {});


    //------------------------------------------------------------------------
    self.addHelper("makeItemStyle", function(item) {
        var category = self.stor.getCached("c:"+item.category[0]);
        var style = "border-color: #" +  category.style.color;
        if (item._id == self.view.$data.selected_item._id) {
            style += "; border-width: 2px;";
        }

        if (item.status == 0) {
            style += "; opacity: 0.45";
        }

        return style;
    });

    self.addHelper("handleSelectItem", function(item) {
        if (self.view.$data.selected_item._id == item._id) {
            self.map.addZoomControl();
            self.view.$data.selected_item = {};
            self.view.$data.show_inspector = false;      
        }
        else {
            self.map.removeZoomControl();
            self.view.$data.selected_item = item;
            self.view.$data.show_inspector = true;
        }
        
    });

    self.addHelper("clearSelectItem", function() {
        self.view.$data.selected_item = {};
        self.view.$data.show_inspector = false;               
        self.view.$data.page_title = venue_title;
    });


    self.addHelper("handleShowMap", function(evt) {
        self.view.$data.show_map = true;
        setTimeout(function() {
            self.renderMap().then(focusMap);
        }, 100);
    });

    self.addHelper("handleShowInput", function(evt) {
        self.view.$data.show_input = true;
    });

    self.addHelper("handleAddItemType", function(item_type) {
        var doc_id = "i:" + venue_id + ":" + item_type.slug;


        self.stor.get(doc_id).then(function(doc) {
            doc.set("updated_at", new Date());
            var votes = doc.get("vote");
            votes.forEach(function(vote) {
                if (vote.slug == "neighbors") {
                    console.log("[detail] signing new vote");
                    vote.votes++;
                }
            });
            doc.set("vote", votes);
            doc.save().then(function() {
                self.view.$data.show_input = false;
            });
        }).catch(function(err) {
            if (err.name == "not_found") {

                new_doc = new LanternDocument(doc_id, self.stor);

                new_doc.set("status", 1);
                new_doc.push("parent", venue_id);
                new_doc.set("$ca", new Date());
                new_doc.push("category", item_type.slug);

                new_doc.save().then(function() {
                    self.view.$data.show_input = false;
                });
            }
        });



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
    

    self.addHelper("timestamp", function(item) {
        // make sure we have a most recent timestamp to work with
        var timestamp = item.updated_at || item.created_at || item.imported_at;
        return moment(timestamp).startOf('hour').fromNow();
    });

    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(function() {
            self.view.$data.allow_back_button = true;
            return self.getCategories();
        })
        .then(function(categories) {
            categories.forEach(function(cat) {
                if (cat.has("tag", "itm")) {
                    self.view.$data.item_types.push(cat.toJSONFriendly());
                }
            });
        })
        .then(self.getManyItems)
        .then(function() {
            //console.log("[detail]", venue_id);

            self.stor.get(venue_id).then(function(doc) {
              
                self.view.$data.marker = doc.toJSONFriendly();
                venue_title = doc.get("title");
                self.view.$data.page_title = venue_title;
                if (doc.get("status") == 1) {
                    self.view.$data.page_tag = "Open Now";
                }
                self.renderMap([venue_id]).then(focusMap);
            })
            .catch(function(err) {
                console.log("[detail] could not get: " + venue_id, err);
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