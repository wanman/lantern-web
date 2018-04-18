window.app = (function() {

    var self;
    var opts = {};

    opts.methods = {
      
        toggleCategory: function(evt) {
            var el = evt.target;
            var cat = el.getAttribute("id");
            self.log("toggle category: " + cat);
            // save category state
            var doc_id = "u:" + self.stor.getUserId();
            return self.stor.upsert(doc_id, function(doc) {
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
                cat = self.stor.getCached(cat_id);
            }
            if (!cat || !cat.hasOwnProperty("color")) {
                self.log("skipping bad cat", cat);
                return "";
            }
            var style = ["color: #" + cat.color];
            style.push("background-color: #" + cat.background_color);
            style.push("border-color: #" + cat.color);
            return style.join("; ");
        }
    };


    opts.data = {
        c_docs: [],
        v_docs: [],
        u_docs: [],
        s_docs: [],
        my_profile: null
    };

    
    opts.beforeMount = function() {
        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/view/setup/setup.html";
        }
        else {
            self.vm.$data.my_profile = self.profile;
        }
    };

    self = new LanternControl("browse", opts, ["v", "c", "u", "s"]);
    return self;
}());