window.page = (function() {
    var self;

    var opts = {};

    opts.data = {
        prompt_for_creds: true,
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
                self.vm.$data.prompt_for_creds = false;
            }, function(err) {
                console.log(err);
            });
        }
    }
    var docs_to_preload = [];
    self = new LanternPage("default", opts, docs_to_preload);
    return self;
}());