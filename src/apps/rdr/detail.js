window.page = (function() {

    var self = new LanternPage("detail");
    var venue_id = self.getHashParameterByName("mrk");
    var item_id = self.getHashParameterByName("itm");
    var venue_title;
    var did_vote = {};
    if (!venue_id) {
        window.location = "/";
        return;
    }

    // @todo make votes stand-alone documents



    //------------------------------------------------------------------------
    /**
    * Centers map on currently selected venue position
    */
    function focusMap() {
       console.log("[detail] showing map");
        if (self.view.$data.marker) {
            var coords = Geohash.decode(self.view.$data.marker.geo[0]);
            self.map.setPosition(coords.lat, coords.lon, 12);
        }
    }
    
    function renderDefaultView() {

        self.view.$data.show_input = false;
        self.view.$data.allow_back_button = true;
        self.view.$data.page_action_icon = "";

        self.stor.get(venue_id).then(function(doc) {
          
            self.view.$data.marker = doc.toJSONFriendly();
            venue_title = doc.get("title");
            self.view.$data.page_title = venue_title;
            if (doc.get("status") == 1 && !doc.has("category", "trk")) {
                self.view.$data.page_tag = "<div class='icon'><i class='fas fa-clock'></i></div>Open Now";
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

   


    /**
    * Updates interface to select specific item
    * e.g. Water, fuel, or clothing at venue
    */
    function selectItem(id) {
        item_id = id;
        console.log("[detail] selected item = " + id);
        var cached_item = self.stor.getCached(item_id);
        self.view.$data.selected_item = self.stor.getCachedIndex(item_id);
    }



    //------------------------------------------------------------------------
    self.addData("show_map", true);
    self.addData("show_inspector", false);
    self.addData("show_input", false);
    self.addData("marker", {});
    self.addData("item_types", []);
    self.addData("selected_item", {});
    self.addData("vote_type", [
        {key: "vote_red_cross", title: "Red Cross"},
        {key: "vote_neighbors", title: "Neighbors"},
        {key: "vote_officials", title: "Town Officials"},
        {key: "vote_oxfam", title: "OXFAM"}
    ]);



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
            selectItem(item._id);
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
            doc.set("status", 1);
            var existing_votes = Number(doc.get("vote_neighbors")) || 0;
            doc.set("vote_neighbors", existing_votes+1)
            doc.save().then(renderDefaultView);
        }).catch(function(err) {
            if (err.name == "not_found") {
                new_doc = new LanternDocument(doc_id, self.stor);
                new_doc.set("status", 1);
                new_doc.push("parent", venue_id);
                new_doc.set("created_at", new Date());
                new_doc.set("vote_neighbors", 0);
                new_doc.set("vote_officials", 0);
                new_doc.set("vote_oxfam", 0);
                new_doc.set("vote_red_cross", 0);
                new_doc.push("category", item_type.slug);
                new_doc.save().then(renderDefaultView);
            }
        });

    });


    // @todo use actual verifications
    self.addHelper("makeVerifications", function(item) {
        return Math.round(Math.random()*10);
    });


    /**
    * Looks for and tallies votes to verify data accuracy
    * e.g. Red Cross (2) + Town Officials (2) + Neighbors (5)
    */
    self.addHelper("countVotes", function countVotes(item) {
        var count = 0;
        for (var idx in self.view.$data.vote_type) {
            var key = self.view.$data.vote_type[idx].key;
            if (item.hasOwnProperty(key)) {
                count += item[key];
            }
        }
        return count;
    });

    self.addHelper("handleVote", function(doc_id, vote_key) {
        
        if (did_vote[vote_key]) {
            console.log("[detail] skip duplicate upvote");
            return;
        }
        
        var doc = new LanternDocument(self.stor.getCached(doc_id), self.stor);
        var votes = doc.get(vote_key) || 0;
        doc.set(vote_key, votes+1);
        did_vote[vote_key] = true;
        doc.save();
    });


    self.addHelper("handleActionButton", function() {
        renderDefaultView();
    });

    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(self.getItems)
        .then(function(items) {
            if (items.length == 0 ) {
                window.location = "/";
            }
        })
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