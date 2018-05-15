window.page = (function() {
    var self;   
    var docs_to_preload = [];
    var $data;

    function completeSetup() {
        self.stor.sync();
        console.log("[index] importing data for region: " + $data.region);
        var importer = new LanternImport(self.stor);
        importer.all();

        setTimeout(function() {
            window.location = "/p/browse/browse.html";
        }, 2500);

    }

    var opts = {};

    opts.data = {
        connection: null,
        region: "",
        network_ssid: "",
        network_pass: "",
        processing: false
    }

    opts.watch = {
        connection: function(val) {
            console.log("[index] connection input: " + val);
        },
        region: function(val) {
            console.log("[index] region input: " + val);
        }
    }

    opts.methods = {
        handleSubmit: function() {


            $data.processing = true;

            self.user.set("status", $data.connection);
            self.user.save();

            if ($data.connection == 1) {
                console.log("[index] storing wifi credentials...");
                self.vm.$http.post(self.base_uri + "/api/network", {
                    "ssid": $data.network_ssid,
                    "pass": $data.network_pass
                }).then(function(response) {
                    console.log(response);
                    completeSetup();
                }, function(err) {
                    console.log(err);
                });
            }
            else {

                completeSetup();
            }

        }
    }
    self = new LanternPage("index", opts, docs_to_preload);
    $data = self.vm.$data;
    return self;
}());