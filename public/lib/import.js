__base = "../";

window.LanternImport = function(stor) {
    
    var self = {};


    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addCategory(slug, title, tag, color, background_color, icon) {
        var doc = new LanternDocument("c:"+slug, stor);
        doc.set("slug", slug);
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

        var time = new Date();

        doc.set("imported_at", time);
        doc.set("created_at", time);
        doc.save(true, true);
    }



    
    function addVenue(id, title, geo, cat, icon, cats) {

        var now = new Date();

        // first define the building or vehicle venue for supply items
        var venue_doc = new LanternDocument("v:"+id, stor);
        venue_doc.set("title", title);
        venue_doc.set("geo", [geo]);
        
        venue_doc.set("icon", icon);
        venue_doc.set("status", 1);
        venue_doc.push("category", cat);
        venue_doc.set("imported_at", now);
        venue_doc.set("created_at", now);

        venue_doc.save(true, true);


        for (var idx in cats) {

            // add supply item for desired categories (water, fuel, etc.)
            var doc = new LanternDocument(["i", venue_doc.id, cats[idx]].join(":"), stor);
            doc.set("status", (Math.random() > 0.1 ? 1 : 0));
            // attach a supply item to a venue
            doc.push("parent", venue_doc.id);
            doc.push("category", cats[idx]);

            // simulate verification of data for accuracy
            doc.set("vote_oxfam", Math.round(Math.random()*1));
            doc.set("vote_red_cross", Math.round(Math.random()*3));
            doc.set("vote_neighbors", Math.round(Math.random()*5));
            doc.set("vote_officials", Math.round(Math.random()*2));

            doc.set("imported_at", now);
            doc.set("created_at", now);
            doc.save(true, false);
        }

    }


    //------------------------------------------------------------------------
    self.category = function() {
        //console.log("[import] adding default item categories");
        addCategory("wtr", "Water", "itm", "78aef9", "e9f2fe", "tint");
        addCategory("ful", "Fuel", "itm", "c075c9", "f5e9f6", "gas-pump");
        addCategory("net", "Internet", "itm", "73cc72", "e8f7e8", "globe");
        addCategory("med", "Medical", "itm", "ff844d", "ffebe2", "prescription-bottle-alt");
        addCategory("clo", "Clothing", "itm", "50c1b6", "e3f5f3", "tshirt");
        addCategory("pwr", "Power", "itm", "f45d90", "f2dae2", "plug");
        addCategory("eat", "Food", "itm", "ffcc54", "fff7ef", "utensils");
        addCategory("bed", "Shelter", "itm", "FFB000", "fef7eb", "bed");
        //addCategory("sup", "Support", "itm", "FFB000", "fef7eb", "question-circle");


        //console.log("[import] adding default Marker categories");
        addCategory("dgr", "Dangerous Area", "mrk");
        addCategory("pwo", "Power Outage", "mrk");


        //console.log("[import] adding sub-categories for Markers");
        addCategory("rdb", "Road Debris", "dgr");
        addCategory("fld", "Flooding", "dgr");
        addCategory("lte", "Looting", "dgr");
        addCategory("cst", "Construction", "dgr");
        addCategory("cba", "Closed by Authorities", "dgr");
        addCategory("dst", "Destroyed", "dgr");
    };


    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    self.venue = function() {
        //console.log("[import] adding default venues");

        // temporary shelters or forward operating bases
        addVenue("enp", "Encinal Park", "9q9hwnw", "tmp", "home", ["bed", "eat"]);
        addVenue("ajc", "AJ's Cafe", "9q9hy3m", "bld", "coffee", ["eat", "wtr", "pwr"]);
        addVenue("hfh", "High School Field House", "9q9hwu2", "bld", "basketball-ball", ["bed", "clo", "net", "wtr"]);
        addVenue("ech", "El Camino Hospital", "9q9htv5", "bld", "hospital-symbol", ["med"]);
        addVenue("slg", "Shell Station", "9q9hqzq", "bld", "gas-pump", ["ful", "wtr"]);
        addVenue("mnt", "Main Street Theatre", "9q9hv8y", "bld", "film", ["net", "pwr"]);
        addVenue("wwt", "Water Truck", "9q9hykv", "trk", "truck", ["wtr"]);
    };

    self.item = function() {
        // items to be added directly along-side Markers
    };

    self.route = function() {
        //console.log("[import] adding default geo routes"); 
        var doc = new LanternDocument("r:%%", stor);
        doc.set("geo", ['drs4b77e8', 'drs4b77e9']);
        var time = new Date();
        doc.set("imported_at", time);
        doc.set("created_at", time);
        doc.save(true, true);
    };


    self.note = function() {
        //console.log("[import] adding default notes");
        var doc = new LanternDocument("n:%%", stor);
        doc.push("tag", "v:test-place");
        var time = new Date();
        doc.set("imported_at", time);
        doc.set("created_at", time);
        doc.save(true, true);
    };

    self.all = function() {
        self.category(); // accepted categories for various types of docs
        self.venue(); // items placed in specific Markers
        self.item(); // dummy for consistency, see Marker()
        self.route(); // routes between Markers
        self.note(); // notes related to items or Markers or routes
    };


    self.clean = function() {
        
        stor.getManyByType("d").then(function(devices) {
            devices.forEach(function(device) {
                if (device.has("tag", "dev")) {
                    console.log(device);
                    device.remove();
                }
            });
        });

        stor.getManyByType("i").then(function(items) {

            items.forEach(function(item) {
                stor.get(item.get("parent")[0]).then(function(doc) {

                })
                .catch(function(err) {
                    if (err.name == "not_found") {
                        console.log(item.id, err);
                        item.remove();
                    }
                });
            });


        });
    };


    //------------------------------------------------------------------------
    return self;
};

    
