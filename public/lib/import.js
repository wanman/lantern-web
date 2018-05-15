window.LanternImport = function(stor) {
    
    console.log("[import] begin...");

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
        doc.save();
    }
    



    //------------------------------------------------------------------------
    self.category = function() {
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
    self.venue = function() {
        //console.log(" adding default venues");
        var doc = new LanternDocument("v:test-place", stor);
        doc.set("title", 'Meadowlane ' + Math.round(Math.random()*100));
        doc.set("geo", ["u4pruydq"]);
        doc.save();
    }

    self.route = function() {
        //console.log(" adding default geo routes"); 
        var doc = new LanternDocument("r:test-route", stor);
        doc.set("geo", ['u4pruydq', 'u4pruyde']);
        doc.save();
    }

    self.supply = function() {
        //console.log(" adding default geo routes");
        var doc = new LanternDocument("s:water-bottles", stor);
        doc.set("title",  "Bottles");
        doc.set("status", 10);
        doc.push("tag", "c:wtr");
        doc.save();
    }

    self.note = function() {
        //console.log(" adding default notes");
        var doc = new LanternDocument("n:test-note", stor);
        doc.push("tag", "v:test-place");
        doc.save();
    }

    self.all = function() {
        self.category();
        self.venue();
        self.route();
        self.supply();
        self.note();
    }



    //------------------------------------------------------------------------
    return self;
}

    