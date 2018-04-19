window.app = (function() {

    var self;
    var opts = {};

    opts.methods = {
      
        toggleCategory: function(evt) {
            var el = evt.target;
            var cat = el.getAttribute("id");
            self.log("toggle category: " + cat);
            return self.toggleSubscribe(cat);
        },
        makeCategoryClass: function(cat) {
            var cls = "";
            if (self.user && self.user.watch) {
                if (self.user.watch[cat._id]) {
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
        user: null
    };

    
    opts.beforeMount = function() {
        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/view/setup/setup.html";
        }
        else {
            self.vm.$data.user = self.user;
        }
    };

    self = new LanternControl("browse", opts, ["v", "c", "u", "s"]);
    return self;
}());