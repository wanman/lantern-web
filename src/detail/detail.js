window.page = (function() {
    var self = new LanternPage("detail");

    var marker_id = self.getURIParameterByName("mrk");
    var item_id = self.getURIParameterByName("itm");

    if (!marker_id) {
        window.location = "/";
        return;
    }

    //------------------------------------------------------------------------
    self.addData("marker", {});
    self.addData("item", {});

    
    
    //------------------------------------------------------------------------
    self.addHelper("getCategoryName", function(item) {
        return self.stor.getCached("c:" + item.category[0]).title;
    });



    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(function() {
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
            });

            if (item_id) {
                self.stor.get(item_id).then(function(doc) {
                    self.view.$data.item = doc.toJSONFriendly();
                });
            }
        });

    return self;
})();