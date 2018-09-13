__base = "../../";

__base = "../../";

window.LanternImport = function(stor) {
    
    var self = {};


    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function addCategory(slug, title, tag, color, background_color, icon) {
        var doc = new LX.Document("c:"+slug, stor);
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
        var venue_doc = new LX.Document("v:"+id, stor);
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
            var doc = new LX.Document(["i", venue_doc.id, cats[idx]].join(":"), stor);
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

        addVenue("fen", "Fenway", Geohash.encode(42.345829, -71.096882, 10), "bld", "basketball-ball", ["bed", "pwr"])
        addVenue("frn", "Franklin Park", Geohash.encode(42.313245, -71.095177, 10), "tmp", "home", [])
        addVenue("bwf", "Whole Foods", Geohash.encode(42.3429892,-71.0910806, 10), "bld", "shopping-basket", ["wtr", "eat"])
    };

    self.item = function() {
        // items to be added directly along-side Markers
    };

    self.route = function() {

        var start_fenway = Geohash.encode(42.345829, -71.096882, 10);
        var pickup_water_whole_foods = Geohash.encode(42.3429892,-71.0910806, 10);
        var franklin_park = Geohash.encode(42.313245, -71.095177, 10);


        // route 1 
        var mass_ave_tremont = Geohash.encode(42.339320, -71.080325, 10);
        var roxbury_columbus_washington = Geohash.encode(42.315772, -71.098237, 10);
        var route1 = [start_fenway, pickup_water_whole_foods, mass_ave_tremont, roxbury_columbus_washington, franklin_park];


        // route 2 (water delay)
        var westland_hemenway = Geohash.encode(42.343967, -71.089956, 10);
        var parker_ruggles = Geohash.encode(42.336952, -71.093588, 10);
        var tremont_ruggles = Geohash.encode(42.334570, -71.089572, 10)
        var route2 = [start_fenway, pickup_water_whole_foods, westland_hemenway, parker_ruggles, tremont_ruggles, franklin_park];


        // route 3
        var huntington_hemenway = Geohash.encode(42.339503, -71.092514, 10);
        var huntington_parker = Geohash.encode(42.338508, -71.092684, 10);
        var heath_square = Geohash.encode(42.326420, -71.100212, 10);
        var columbus_ave_seaver = Geohash.encode(42.313336, -71.095117, 10);
        var route3 = [ start_fenway, pickup_water_whole_foods, westland_hemenway, heath_square, columbus_ave_seaver, franklin_park];


        var routes = [route1,route2,route3];


        //console.log("[import] adding default geo routes"); 
        var doc = new LX.Document("r:water_franklin_park:1", stor);
        doc.set("geo", route1);
        doc.set("status", 1); // complete
        doc.set("rating", 0.9)
        doc.push("tag", "flood");
        doc.push("parent", "v:fen");
        doc.push("parent", "v:fpk");
        var time = new Date();
        doc.set("created_at", time);
        doc.save(true, false);


        var doc = new LX.Document("r:water_franklin_park:2", stor);
        doc.set("geo", route2);
        doc.push("tag", "flood");
        doc.set("status", 1); // complete
        doc.set("rating", 0.75)
        doc.push("parent", "v:fen");
        doc.push("parent", "v:fpk");
        var time = new Date();
        doc.set("created_at", time);
        doc.save(true, false);

        var doc = new LX.Document("r:water_franklin_park:3", stor);
        doc.set("geo", route3);
        doc.push("tag", "flood");
        doc.push("parent", "v:fen");
        doc.push("parent", "v:fpk");
        doc.set("status", 1); // complete
        doc.set("rating", 0.6)
        var time = new Date();
        doc.set("created_at", time);
        doc.save(true, false);


    };


    self.note = function() {
        //console.log("[import] adding default notes");
        var doc = new LX.Document("n:%%", stor);
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

    

