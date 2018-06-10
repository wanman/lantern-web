window.LanternImport = function(stor) {
    
    var self = {};


    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addCategory(slug, title, tag, color, background_color, icon) {
        var doc = new LanternDocument("c:"+slug, stor);
        doc.set("title", title);
        doc.push("tag", tag);

        if (background_color && color) {

            doc.set("style", {
                "color": color, 
                "background-color": background_color}
            );
        }

        if (icon) {
            doc.set("icon", icon);
        }

        doc.set("$ia", new Date());
        doc.save();
    }

    
    function addMarker(id, title, geo, cat) {
        var venue_doc = new LanternDocument("m:"+id, stor);
        venue_doc.set("title", title);
        venue_doc.set("geo", [geo]);
        venue_doc.push("category", cat);
        venue_doc.set("$ia", new Date());
        venue_doc.save();

        var supply_id = "i:wtr-1-" + id;
        var supply_doc = new LanternDocument(supply_id, stor);
        supply_doc.set("status", 1);
        supply_doc.push("parent", venue_doc.id);
        supply_doc.push("category", "wtr");
        supply_doc.set("$ia", new Date());
        supply_doc.save();


        var net_id = "i:net-1-" + id;
        var net_doc = new LanternDocument(net_id, stor);
        net_doc.set("status", 1);
        net_doc.push("parent", venue_doc.id);
        net_doc.push("category", "net");
        net_doc.set("$ia", new Date());
        net_doc.save();
    }

    function addKind(id, title) {
        var kind_doc = new LanternDocument("k:" +id, stor);
        kind_doc.set("title", title);
        kind_doc.set("$ia", new Date());
        kind_doc.save();
    }


    //------------------------------------------------------------------------
    self.category = function() {
        console.log("[import] adding default item categories");
        addCategory("wtr", "Water", "itm", "78aef9", "e9f2fe", "tint");
        addCategory("ful", "Fuel", "itm", "c075c9", "f5e9f6", "gas-pump");
        addCategory("net", "Internet", "itm", "73cc72", "e8f7e8", "globe");
        addCategory("med", "Medical", "itm", "ff844d", "ffebe2", "prescription-bottle-alt");
        addCategory("dnt", "Donation", "itm", "50c1b6", "e3f5f3", "tshirt");
        addCategory("pwr", "Power", "itm", "f45d90", "f2dae2", "plug");
        addCategory("eqp", "Equipment", "itm", "ffcc54", "fff7ef", "toolbox");


        console.log("[import] adding default Marker categories");
        addCategory("shr", "Shelter", "mrk");
        addCategory("sfe", "Safe Area", "mrk");
        addCategory("sup", "Supply Location", "mrk");
        addCategory("dgr", "Dangerous Area", "mrk");
        addCategory("rdc", "Road Conditions", "mrk");
        addCategory("pwo", "Power Outage", "mrk");


        console.log("[import] adding sub-categories for Markers");
        addCategory("rdb", "Road Debris", "dgr");
        addCategory("fld", "Flooding", "dgr");
        addCategory("cst", "Construction", "dgr");
        addCategory("cba", "Closed by Authorities", "dgr");
        addCategory("dst", "Destroyed", "dgr");
    };


    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    self.marker = function() {
        console.log("[import] adding default venues");
        addMarker("css", "Central City Shelter", "drs4b7s", "str");
        addMarker("aic", "AI's Cafe", "drs4b77", "sup");
        addMarker("rcm", "Red Cross HQ", "drs4b75", "str");
    };

    self.item = function() {
        // items to be added directly along-side Markers
    };

    self.route = function() {
        console.log("[import] adding default geo routes"); 
        var doc = new LanternDocument("r:test-route", stor);
        doc.set("geo", ['drs4b77e8', 'drs4b77e9']);
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
        self.category(); // accepted categories for various types of docs
        self.marker(); // items placed in specific Markers
        self.item(); // dummy for consistency, see Marker()
        self.route(); // routes between Markers
        self.note(); // notes related to items or Markers or routes
    };



    //------------------------------------------------------------------------
    return self;
};

    