window.LanternImport = function(stor) {
    
    var self = {};


    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addCategory(title, slug, color, background_color) {
        var doc = new LanternDocument("c:"+slug, stor);
        doc.set("title", title);
        doc.set("style", {
            "color": color, 
            "background-color": background_color}
        );
        doc.set("$ia", new Date());
        doc.save();
    }
    
    function addZone(id, title, geo) {
        var venue_doc = new LanternDocument(id, stor);
        venue_doc.set("title", title);
        venue_doc.set("geo", [geo]);
        venue_doc.set("$ia", new Date());
        venue_doc.save();

        var supply_id = "i:wtr-" + Math.round((Math.random()*100000));
        var supply_doc = new LanternDocument(supply_id, stor);
        supply_doc.set("status", 1);
        supply_doc.push("parent", id);
        supply_doc.push("tag", "c:wtr");
        supply_doc.set("$ia", new Date());
        supply_doc.save();
    }



    //------------------------------------------------------------------------
    self.category = function() {
        console.log("[import] adding default resource categories");
        addCategory("Shelter", "shr", "ffcc54", "fff7ef");
        addCategory("Water", "wtr", "78aef9", "e9f2fe");
        addCategory("Fuel", "ful", "c075c9", "f5e9f6");
        addCategory("Internet", "net", "73cc72", "e8f7e8");
        addCategory("Medical", "med", "ff844d", "ffebe2");
        addCategory("Donations", "dnt", "50c1b6", "e3f5f3");
        addCategory("Power", "pwr", "f45d90", "f2dae2");
        addCategory("Equipment", "eqp", "4aaddb", "e8f4fa");
    };


    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    self.zone = function() {
        console.log("[import] adding default venues");
        addZone("z:css", "Central City Shelter", "u4pruydq");
        addZone("z:aic", "AI's Cafe", "u4pruydr");
        addZone("z:rcm", "Red Cross HQ", "u4pruyqr");
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
        self.category();
        self.zone();
        self.route();
        self.note();
    };



    //------------------------------------------------------------------------
    return self;
};

    