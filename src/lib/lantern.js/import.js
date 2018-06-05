window.LanternImport = function(stor) {
    
    var self = {};


    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addTag(slug, title, valid_doc_types, color, background_color) {
        var doc = new LanternDocument("t:"+slug, stor);
        doc.set("title", title);
        valid_doc_types.forEach(function(type) {
            doc.push("tag", type);
        });
        doc.set("style", {
            "color": color, 
            "background-color": background_color}
        );
        doc.set("$ia", new Date());
        doc.save();
    }
    
    function addZone(id, title, geo, tag) {
        var venue_doc = new LanternDocument("z:"+id, stor);
        venue_doc.set("title", title);
        venue_doc.set("geo", [geo]);
        venue_doc.push("tag", tag);
        venue_doc.set("$ia", new Date());
        venue_doc.save();

        var supply_id = "i:wtr-" + Math.round((Math.random()*100000));
        var supply_doc = new LanternDocument(supply_id, stor);
        supply_doc.set("status", 1);
        supply_doc.push("parent", venue_doc.id);
        supply_doc.push("tag", "wtr");
        supply_doc.set("$ia", new Date());
        supply_doc.save();
    }

    function addKind(id, title) {
        var kind_doc = new LanternDocument("k:" +id, stor);
        kind_doc.set("title", title);
        kind_doc.set("$ia", new Date());
        kind_doc.save();
    }


    //------------------------------------------------------------------------
    self.tag = function() {
        console.log("[import] adding default item tags");
        addTag("shr", "Shelter", ["i"], "ffcc54", "fff7ef");
        addTag("wtr", "Water", ["i"], "78aef9", "e9f2fe");
        addTag("ful", "Fuel", ["i"], "c075c9", "f5e9f6");
        addTag("net", "Internet", ["i"], "73cc72", "e8f7e8");
        addTag("med", "Medical", ["i"], "ff844d", "ffebe2");
        addTag("dnt", "Donations", ["i"], "50c1b6", "e3f5f3");
        addTag("pwr", "Power", ["i"], "f45d90", "f2dae2");
        addTag("eqp", "Equipment", ["i"], "4aaddb", "e8f4fa");


        console.log("[import] adding default zone tags");
        addTag("sup", "Supply Location", ["z"]);
        addTag("str", "Safe Shelter", ["z"]);
        addTag("dgr", "Dangerous Area", ["z"]);
    };


    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    self.zone = function() {
        console.log("[import] adding default venues");
        addZone("css", "Central City Shelter", "u4pruydq", "str");
        addZone("aic", "AI's Cafe", "u4pruydr", "sup");
        addZone("rcm", "Red Cross HQ", "u4pruyqr", "str");
    };

    self.item = function() {
        // items to be added directly along-side zones
    };

    self.route = function() {
        console.log("[import] adding default geo routes"); 
        var doc = new LanternDocument("r:test-route", stor);
        doc.set("geo", ['u4pruydq', 'u4pruyde']);
        doc.set("$ia", new Date());
        doc.save();
    };


    self.note = function() {
        console.log("[import] adding default notes");
        var doc = new LanternDocument("n:test-note", stor);
        doc.push("tag", "v:test-place");
        doc.set("$ia", new Date());
        doc.save();
    };

    self.all = function() {
        self.tag(); // accepted tags for various types of docs
        self.zone(); // items placed in specific zones
        self.item(); // dummy for consistency, see zone()
        self.route(); // routes between zones
        self.note(); // notes related to items or zones or routes
    };



    //------------------------------------------------------------------------
    return self;
};

    