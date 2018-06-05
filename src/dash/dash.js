window.page = (function() {



    var self = new LanternPage("dash");

    function display(type) {
        self.view.$data[type.key+"_docs"] = [];
        self.stor.getManyByType(type.key)
            .then(function(docs) {
                type.docs = docs;
            });
    }

    //------------------------------------------------------------------------
    self.addData("types", [
        {key: "z", slug: "zone", docs: []},
        {key: "r", slug: "route", docs: []},
        {key: "c", slug: "category", docs: []},
        {key: "i", slug: "item", docs: []},
        {key: "n", slug: "note", docs: []}
    ]);
    self.addData("network_status", -1);

    //------------------------------------------------------------------------
    self.addHelper("loadTestData", function() {
        var importer = new LanternImport(self.stor);
        self.view.$data.types.forEach(function(type) {
            importer[type.slug]();
        });
    });

    self.addHelper("removeAllDocs", function() {
        self.stor.removeAll();
    });

    self.addHelper("pluralize", function(count) {
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
                display(type);
            });
        });

    return self;
}());