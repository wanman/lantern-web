__base = "../";

window.page = (function() {



    var self = new LanternPage("admin");
    

    function validateForm() {

        var $data = self.view.$data;
        
        $data.processing = true;
        
        console.log("[network] storing wifi credentials...");
        self.view.$http.post(self.getBaseURI() + "/api/config/ssid", {
            "ssid": $data.network_ssid,
            "pass": $data.network_pass
        }).then(function(response) {
            completeSetup();
        }, function(err) {
            $data.warning = "Please check your wifi credentials and try again.";
            $data.processing = false;
        });
    }


    //------------------------------------------------------------------------
    self.addData("types", [
        {key: "c", slug: "category"},
        {key: "m", slug: "marker"},
        {key: "i", slug: "item"},
        {key: "r", slug: "route"},
        {key: "n", slug: "note"},
        {key: "u", slug: "user"}
    ]);

    self.addData("warning", "");
    self.addData("connection", false);
    self.addData("network_ssid", "");
    self.addData("network_pass", "");
    self.addData("processing", false);

    //------------------------------------------------------------------------
    self.addHelper("loadTestData", function() {
        var importer = new LanternImport(self.stor);
        self.view.$data.types.forEach(function(type) {
            if (!importer[type.slug]) {
                console.log("[dash] missing importer for " + type.slug);
            }
            else {
                importer[type.slug]();
            }
        });
    });

    self.addHelper("handleSelectType", function(type) {
        var docs = self.view.$data[type.key +"_docs"];
        docs.forEach(function(doc) {
            console.log(JSON.stringify(doc));
        });
    });

    self.addHelper("removeAllDocs", function() {
        self.stor.removeAll();
    });

    self.addHelper("getDocCount", function(type) {

        try {
            var count = self.view.$data[type.key + "_docs"].length;
            if (count === 0) {
                return 'No Docs';
            } 
            else if (count === 1) {
                return '1 Doc';
            } else {
                return count + ' Docs';
            }
        }
        catch(e) {
            console.log("can't get document count for ", type, e);
        }
    });    


    self.addHelper("handleSubmit", function() {
        self.view.$data.processing = true;
        setTimeout(validateForm, 150);
    });




    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            self.view.$data.page_title = "Admin";
        })
        .then(self.connect)
        .then(function() {
            self.view.$data.types.forEach(function(type) {
                self.stor.getManyByType(type.key);
            });

            self.view.$watch("connection", function(new_val, old_val) {
                if (new_val === false) {
                    self.view.$data.warning = false;
                    self.view.$data.network_pass = "";
                }
            });
        });

    return self;
}());
