window.page = (function() {

    var opts = {};
    opts.beforeMount = function() {
        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/p/setup/setup.html";
        }
        else {
            self.vm.$data.my_profile = self.profile;
        }
    };

    var self = new LanternPage("staff", opts, ["c"]);
    return self;
}());