window.page = (function() {

    var types = [
        {key: "v", title: "Venue", docs: [], populate: addDefaultVenues},
        {key: "r", title: "Route", docs: [], populate: addDefaultRoutes},
        {key: "c", title: "Category", docs: [], populate: addDefaultCategories},
        {key: "s", title: "Supply", docs: [], populate: addDefaultSupplyLevels},
        {key: "n", title: "Note", docs: [], populate: addDefaultNotes},
        {key: "u", title: "User", docs: [], populate: addDefaultUser}
    ];

    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addCategory(title, slug, color, background_color) {
        var doc = new LanternDocument("c:"+slug, self.stor);
        doc.set("title", title);
        doc.set("style", {
            "color": color, 
            "background-color": background_color}
        );
        doc.save();
    }

    /**
    * No need to create a default user, for now...
    */
    function addDefaultUser() {
        self.getOrCreateUser();

    }
    
    function addDefaultCategories() {
        //console.log(" adding default resource categories");
        addCategory("Shelter", "shr", "ffcc54", "fff7ef");
        addCategory("Water", "wtr", "78aef9", "e9f2fe");
        addCategory("Fuel", "ful", "c075c9", "f5e9f6");
        addCategory("Internet", "net", "73cc72", "e8f7e8");
        addCategory("Medical", "med", "ff844d", "ffebe2");
        addCategory("Donations", "dnt", "50c1b6", "e3f5f3");
        addCategory("Power", "pwr", "f45d90", "f2dae2");
        addCategory("Equipment", "eqp", "4aaddb", "e8f4fa");
    }

    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    function addDefaultVenues() {
        //console.log(" adding default venues");
        var doc = new LanternDocument("v:test-place", self.stor);
        doc.set("title", 'Meadowlane ' + Math.round(Math.random()*100));
        doc.set("geo", ["u4pruydq"]);
        doc.save();
    }

    function addDefaultRoutes() {
        //console.log(" adding default geo routes"); 
        var doc = new LanternDocument("r:test-route", self.stor);
        doc.set("geo", ['u4pruydq', 'u4pruyde']);
        doc.save();
    }

    function addDefaultSupplyLevels() {
        //console.log(" adding default geo routes");
        var doc = new LanternDocument("s:water-bottles", self.stor);
        doc.set("title",  "Bottles");
        doc.set("status", 10);
        doc.push("tag", "c:wtr");
        doc.save();
    }

    function addDefaultNotes() {
        //console.log(" adding default notes");
        var doc = new LanternDocument("n:test-note", self.stor);
        doc.push("tag", "v:test-place");
        doc.save();
    }

    //------------------------------------------------------------------------

    var opts = {};

    opts.data = {
        user: null,
        types: types
    };

    opts.methods = {
        loadTestData: function() {
            for (var idx in types) {
                types[idx].populate();
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