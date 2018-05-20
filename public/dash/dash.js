window.page = (function() {


    var types = [
        {key: "v", slug: "venue", docs: []},
        {key: "r", slug: "route", docs: []},
        {key: "c", slug: "category", docs: []},
        {key: "s", slug: "supply", docs: []},
        {key: "n", slug: "note", docs: []}
    ];



    //------------------------------------------------------------------------

    var opts = {};

    opts.data = {
        user: null,
        types: types
    };

    opts.methods = {
        loadTestData: function() {
            var importer = new LanternImport(self.stor);
            for (var idx in types) {
                var type = types[idx];
                importer[types[idx].slug]();
            }
        },
        removeAllDocs: function() {
            self.stor.removeAll();
        },
        pluralize: function(count) {
            if (count === 0) {
                return 'No Docs';
            } 
            else if (count === 1) {
                return '1 Doc';
            } else {
                return count + ' Docs';
            }
        }
    };

    var docs_to_preload = [];
    for (var idx in types) {
        docs_to_preload.push(types[idx].key);
        opts.data[types[idx].key+"_docs"] = types[idx].docs;
    }

    var self = new LanternPage("dash", opts, docs_to_preload);
    return self;
}());