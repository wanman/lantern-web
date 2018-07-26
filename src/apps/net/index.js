window.page = (function() {
    var self = new LanternPage("network");


    var tag_tally = {};

    function setVerificationCount() {
        self.view.$data.verifications = 0;
        self.getItems().then(function(items) {
            items.forEach(function(item) {
                if (item.has("vote")) {
                    var vt = item.get("vote");
                    vt.forEach(function(row) {
                        self.view.$data.verifications += Number(row.votes);
                    });
                }
            });
        });
    }

    self.addData("needs", 0);
    self.addData("verifications", 0);

    self.addHelper("handleInspectDevices", function() {
        self.view.$data.d_docs.forEach(function(doc) {
            console.log(JSON.stringify(doc));
        });
    });


    self.addHelper("handleInspectUsers", function() {
        self.view.$data.u_docs.forEach(function(doc) {
            console.log(JSON.stringify(doc));
        });
    });

    self.addHelper("handleInspectSearches", function() {
        console.log(tag_tally);
    });


    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(self.getDevices)
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
        })
        .then(setVerificationCount);
    return self;
})();