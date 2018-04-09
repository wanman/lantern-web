window.admin_view = (function() {

    var self = {
        store: new LanternStore(),
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
        loadInterests: loadInterests
    };

    /**
    * Register Interest
    *
    * Save an interest to the database for future use in the interface
    * Allows for dynamically adding new interests over over time
    */
    function registerInterest(title, slug, color, background_color) {
        return self.store.db.upsert("int-"+slug, function(doc) {
            doc.type = "interest";
            doc.title = title;
            doc.color = color;
            doc.background_color = background_color;
            if (!doc.created_at) {
                doc.created_at = new Date();
            }
            else {
                doc.updated_at = new Date();
            }
            console.log("[admin] registering new interest: ", doc);
            return doc;
        }).then(function (response) {
            console.log("[admin] registered interests");
        }).catch(function (err) {
            console.log(err);
        });
    }

    function loadInterests() {
        self.store.db.allDocs({include_docs: true}).then(function(result) {
            for (var idx in result.rows) {
                var doc = result.rows[idx].doc;
                console.log(doc);
                if (doc.type == "interest") {
                    vm.$data.interests.push(doc);
                    console.log(doc)
                }
            }
        });
    }


    //---------------------------------------------------------------- Vue App
    var opts = {
        methods: {},
        data: {
            interests: []
        },
        beforeMount: function() {
            console.log("[admin] view initialized");
            self.store.sync()
                .on('active', function () {
                    console.log("[admin] sync enabled");
                });

        }
    };
    var vm = new Vue(opts);
    vm.$mount('#admin-app');

    return self;
}());