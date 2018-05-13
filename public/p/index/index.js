window.page = (function() {
    var self;   

    function completeSetup() {

        var importer = new LanternImport(self.stor);
        importer.all();
        self.vm.$data.is_setup = true;
    }

    var opts = {};

    opts.data = {
        is_setup: false,
        network_ssid: "",
        network_pass: ""
    }

    opts.methods = {
        handleSubmit: function() {
            console.log("submitting credentials...");
            self.vm.$http.post(self.base_uri + "/api/network", {
                "ssid": self.vm.$data.network_ssid,
                "pass": self.vm.$data.network_pass
            }).then(function(response) {
                console.log(response);
                completeSetup();
            }, function(err) {
                console.log(err);
            });
        },
        handleSkip: function() {
            console.log("skipping wifi credentials...");
            completeSetup();
        }
    }
    var docs_to_preload = [];
    self = new LanternPage("index", opts, docs_to_preload);
    return self;
}());