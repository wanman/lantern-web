window.app = (function() {

    var self = {
        registerInterests: function() {
            registerInterest("Shelter", "shr", "ffcc54", "fff7ef");
            registerInterest("Water", "wtr", "78aef9", "e9f2fe");
            registerInterest("Fuel", "ful", "c075c9", "f5e9f6");
            registerInterest("Internet", "net", "73cc72", "e8f7e8");
            registerInterest("Medical", "med", "ff844d", "ffebe2");
            registerInterest("Donations", "dnt", "50c1b6", "e3f5f3");
            registerInterest("Power", "pwr", "f45d90", "f2dae2");
            registerInterest("Supplies", "sup", "4aaddb", "e8f4fa");
        },
        registerPlace: registerPlace
    };

    /**
    * Register Interest
    *
    * Save an interest to the database for future use in the interface
    * Allows for dynamically adding new interests over over time
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

    var vue_opts = {
        methods: {},
        data: {
            r_docs: []
        },
        beforeMount: function() {
            console.log("[admin] view initialized");
        }
    };

    self.vm = new Vue(vue_opts);
    self.vm.$mount('#admin-app');

    self.store = new LanternStore(self.vm.$data);
    self.store.setup(["r"]);

    return self;
}());