window.page = (function() {

    var opts = {};
    opts.beforeMount = function() {
        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/p/setup/setup.html";
        }
    };

    var self = new LanternPage("staff", opts, ["c"]);
    return self;
}());