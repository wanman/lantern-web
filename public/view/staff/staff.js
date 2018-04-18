window.app = (function() {

    var opts = {};
    opts.beforeMount = function() {
        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/view/setup/setup.html";
        }
        else {
            self.vm.$data.my_profile = self.profile;
        }
    };

    var self = new LanternControl("staff", opts, ["c"]);
    return self;
}());