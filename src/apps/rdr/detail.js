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

    function renderDefaultView() {

        self.view.$data.show_input = false
        self.view.$data.allow_back_button = true;
        self.view.$data.page_action_icon = "";

        self.stor.get(venue_id).then(function(doc) {
          
            self.view.$data.marker = doc.toJSONFriendly();
            venue_title = doc.get("title");
            self.view.$data.page_title = venue_title;
            if (doc.get("status") == 1 && !doc.has("category", "trk")) {
                self.view.$data.page_tag = "Open Now";
            }
            self.renderMap([venue_id]).then(focusMap);
        })
        .catch(function(err) {
            console.log("[detail] could not get: " + venue_id, err);
        });

        if (item_id) {
            self.view.$data.selected_item = self.stor.getCachedIndex(item_id);
            self.view.$data.page_loading = false;
        }
        else {
            self.view.$data.page_loading = false;
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
        if (item._id == item_id) {
            style += "; border-width: 2px;";
        }

        if (item.status == 0) {
            style += "; opacity: 0.45";
        }

        return style;
    });

    self.addHelper("handleToggleSelectItem", function(item) {
        
        if (item._id == item_id) {
            //console.log("[detail] hide inspector");
            item_id = null;
            self.map.addZoomControl();
            self.view.$data.show_inspector = false;
            self.view.$data.selected_item = {};
        }
        else {
            self.view.$data.selected_item = self.stor.getCachedIndex(item._id);
            item_id = item._id;
            //console.log("[detail] show inspector");
            self.view.$data.show_inspector = true;
            self.map.removeZoomControl();
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

        self.view.$data.page_action_icon = "times-circle";
        self.view.$data.page_title = "Choose Supply Type";
        self.view.$data.page_tag = "";
        self.view.$data.allow_back_button = false;
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
            doc.save().then(renderDefaultView);
        }).catch(function(err) {
            if (err.name == "not_found") {

                new_doc = new LanternDocument(doc_id, self.stor);

                new_doc.set("status", 1);
                new_doc.push("parent", venue_id);
                new_doc.set("$ca", new Date());
                new_doc.push("vote", {
                    "slug": "neighbors",
                    "title": "Neighbors",
                    "votes": 0
                });
                new_doc.push("vote", {
                    "slug": "town",
                    "title": "Town Officials",
                    "votes": 0
                });
                new_doc.push("category", item_type.slug);

                new_doc.save().then(renderDefaultView);
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
    

    self.addHelper("handleVote", function(json, b) {

        var doc = new LanternDocument(self.stor.getCached(json._id), self.stor);

        if (doc.has("vote")) {
            var votes = doc.get("vote");
            for (var idx in votes) { 
                if (votes[idx].slug == b.slug) {
                    json.vote[idx].votes = votes[idx].votes = votes[idx].votes+1;
                    doc.set("vote", votes);
                    doc.save();
                    console.log("[detail] upvoted verification", votes[idx].votes);
                }
            }
        }
    });


    self.addHelper("handleActionButton", function() {
        renderDefaultView();
    });

    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(self.getItems)
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
        .then(renderDefaultView);

    return self;
})();