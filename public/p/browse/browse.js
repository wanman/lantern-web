window.page = (function() {

    var self;
    var opts = {};

    opts.methods = {
      
        toggleCategory: function(evt) {
            var el = evt.target;
            var cat = el.getAttribute("id");
            console.log("toggle category: " + cat);

            // save category state
            return self.stor.upsert("u:"+self.getUserId(), function(user_doc) {
                console.log(user_doc);
                user_doc.updated_at = new Date();
                if (!user_doc.watch) user_doc.watch = {};
                user_doc.watch[cat] = (user_doc.watch[cat] === true ? false : true);
                self.vm.$data.user = user_doc;
                return user_doc;
            });
        },
        makeCategoryClass: function(cat) {
            var cls = "";
            var user = self.vm.$data.user;
            if (user && user.watch) {
                if (user.watch[cat._id]) {
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
            if (!cat || !cat.hasOwnProperty("style")) {
                console.log("skipping bad cat", cat);
                return "";
            }
            var style = ["color: #" + cat.style.color];
            style.push("background-color: #" + cat.style.background_color);
            style.push("border-color: #" + cat.style.color);
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