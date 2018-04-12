window.app = (function() {

    var render = {};

    var self = {};

    var vue_opts = {
        methods: {
            pluralize: function(count) {
                if (count === 0) {
                    return 'No Users';
                } 
                else if (count === 1) {
                    return '1 User';
                } else {
                    return count + ' Users';
                }
            },
            toggleCategory: function(evt) {
                var el = evt.target;
                var cat = el.getAttribute("id");
                console.log("[map] toggle category: " + cat);
                // save category state
                var doc_id = "u:" + self.store.getUserId();
                return self.store.upsert(doc_id, function(doc) {
                    doc.updated_at = new Date();
                    if (!doc.watch) doc.watch = {};
                    doc.watch[cat] = (doc.watch[cat] === true ? false : true);
                    self.vm.$data.my_profile = doc;
                    return doc;
                });
            }
        },
        data: {
            c_docs: [],
            u_docs: [],
            my_profile: null
        },
        beforeMount: function() {
            console.log("[map] view initialized");

            self.store.get("u:" + self.store.getUserId())
                .then(function(doc) {
                    self.vm.$data.my_profile = doc;
                });
        }
    };

    self.vm = new Vue(vue_opts);

    self.store = new LanternStore(self.vm.$data);
    self.store.setup(["c", "u"]).then(function() {
        self.vm.$mount('#map-app');
    });

    return self;
    
}());