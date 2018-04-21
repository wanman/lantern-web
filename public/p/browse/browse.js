window.page = (function() {

    var self;
    var opts = {};

    opts.methods = {
      
        toggleCategory: function(evt) {
            var el = evt.target;
            var cat = el.getAttribute("id");
            var state = ( self.user.get("watch", cat) ? true : false);
            self.user.set("watch", cat, !state);
            self.user.save();
        },
        makeCategoryClass: function(cat) {
            var cls = "";
            var user = self.user;
            if (user && user.has("watch", cat._id)) {
                if (user.get("watch", cat._id)) {
                    cls += "active ";
                }
            }
            return cls;
        },
        makeCategoryStyle: function(cat) {
            var obj;

            if (!cat) {
                return;
            }

            if (typeof(cat) == "string") {
                var cat_id = "c:"+cat;
                obj = self.stor.getCached(cat_id);
            }
            else {
                obj = cat;
            }

            var doc = new LanternDocument(obj, self.stor);
            var style = ["color: #" + doc.get("style","color")];
            style.push("background-color: #" + doc.get("style", "background-color"));
            style.push("border-color: #" + doc.get("style", "color"));
            return style.join("; ");
        }
    };


    opts.data = {
        user: null
    };

    var preload = ["v", "c", "u", "s"];

    for (var idx in preload) {
        opts.data[preload[idx] +"_docs"] = [];
    }



    opts.beforeMount = function() {
        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/p/setup/setup.html";
        }
    };

    self = new LanternPage("browse", opts, preload);
    return self;
}());