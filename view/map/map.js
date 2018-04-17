window.app = (function() {

    var render = {};

    var self = {};

    var vue_opts = {
        methods: {
            pluralize: function(count) {
                if (count < 1) {
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
                    console.log(JSON.stringify(doc));
                    return doc;
                });
            },
            makeCategoryClass: function(cat) {
                var cls = "";
                var profile = self.vm.$data.my_profile;
                if (profile && profile.watch) {
                    if (profile.watch[cat._id]) {
                        cls += "active ";
                    }
                }
                return cls;
            },
            makeCategoryStyle: function(cat) {
                if (typeof(cat) == "string") {
                    var cat_id = "c:"+cat;
                    cat = self.store.getCached(cat_id);
                }
                if (!cat.color) {
                    console.log("[map] skipping bad cat", cat);
                    return;
                }
                var style = ["color: #" + cat.color];
                style.push("background-color: #" + cat.background_color);
                style.push("border-color: #" + cat.color);
                return style.join("; ");
            }
        },
        data: {
            c_docs: [],
            v_docs: [],
            u_docs: [],
            s_docs: [],
            my_profile: null
        },
        beforeMount: function() {
            console.log("[map] view initialized");
        }
    };

    self.vm = new Vue(vue_opts);

    self.store = new LanternStore(self.vm.$data);

    self.store.setup(["v", "c", "u", "s"]).then(function() {
        self.store.get("u:" + self.store.getUserId())
            .then(function(profile) {
                self.vm.$data.my_profile = profile;

            });

        self.vm.$mount('#map-app');
    });

    return self;
    
}());