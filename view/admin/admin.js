window.app = (function() {

    var self = {};

    /**
    * Save an interest to the database for future use in the interface.
    * Allows for dynamically adding new interests over over time.
    */
    function registerInterest(title, slug, color, background_color) {
        return self.store.upsert("r:"+slug, function(doc) {
            doc.title = title;
            doc.color = color;
            doc.background_color = background_color;
            if (!doc.created_at) {
                doc.created_at = new Date();
            }
            else {
                doc.updated_at = new Date();
            }
            return doc;
        });
    }
    

    /**
    * Save an arbitrary map location into the database.
    * Allows for tracking population size and resource distribution
    * against meaningful points in a town.
    */
    function registerPlace() {
        return self.store.upsert("p:test-place", function(doc) {
            doc.title = 'Meadowlane ' + Math.round(Math.random()*100);
            if (!doc.created_at) {
                doc.created_at = new Date();
            }
            else {
                doc.updated_at = new Date();
            }
            return doc;
        });
    }


    //------------------------------------------------------------------------
    var vue_opts = {
        methods: {
            importResources: function() {
                console.log("[admin] importing resources");
                registerInterest("Shelter", "shr", "ffcc54", "fff7ef");
                registerInterest("Water", "wtr", "78aef9", "e9f2fe");
                registerInterest("Fuel", "ful", "c075c9", "f5e9f6");
                registerInterest("Internet", "net", "73cc72", "e8f7e8");
                registerInterest("Medical", "med", "ff844d", "ffebe2");
                registerInterest("Donations", "dnt", "50c1b6", "e3f5f3");
                registerInterest("Power", "pwr", "f45d90", "f2dae2");
                registerInterest("Supplies", "sup", "4aaddb", "e8f4fa");
            },
            importPlaces: function() {
                console.log("[admin] importing places");
                registerPlace();
            },
            pluralize: function(count) {
                if (count === 0) {
                    return 'No Documents';
                } 
                else if (count === 1) {
                    return '1 Document';
                } else {
                    return count + ' Documents';
                }
            }
        },
        data: {
            p_docs: [],
            r_docs: []
        },
        beforeMount: function() {
            console.log("[admin] view initialized");
        }
    };

    self.vm = new Vue(vue_opts);
    self.store = new LanternStore(self.vm.$data);
    self.store.setup(["r","p"]).then(function() {
        self.vm.$mount('#admin-app');
    });

    return self;
}());