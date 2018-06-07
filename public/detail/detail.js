__base = "../";

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
    self.render()
        .then(self.connect)
        .then(function() {
            console.log("[detail]", marker_id);

            self.stor.get(marker_id).then(function(doc) {
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
