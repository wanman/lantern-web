window.page = (function() {



    var self = new LanternPage("admin");

    //------------------------------------------------------------------------
    self.addData("types", [
        {key: "t", slug: "tag"},
        {key: "z", slug: "zone"},
        {key: "i", slug: "item"},
        {key: "r", slug: "route"},
        {key: "n", slug: "note"},
    ]);

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

        var count = self.view.$data[type.key + "_docs"].length;
        if (count === 0) {
            return 'No Docs';
        } 
        else if (count === 1) {
            return '1 Doc';
        } else {
            return count + ' Docs';
        }
    });



    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(function() {
            self.view.$data.types.forEach(function(type) {
                self.stor.getManyByType(type.key);
            });
        });

    return self;
}());