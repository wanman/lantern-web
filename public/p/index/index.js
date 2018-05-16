window.page = (function() {
    var self;   
    var docs_to_preload = [];


    function validateForm() {
        var $data = self.vm.$data;
        if ($data.region == "") {
            $data.warning = "Please select your geographical region";
            return;
        }
        else if ($data.connection == null) {
            $data.warning = "Please enter your connection type";
            return;
        } 
        
        $data.processing = true;

        self.user.set("status", $data.connection);
        self.user.save();

        if ($data.connection == 1) {
            console.log("[index] storing wifi credentials...");
            self.vm.$http.post(self.base_uri + "/api/config/ssid", {
                "ssid": $data.network_ssid,
                "pass": $data.network_pass
            }).then(function(response) {
                completeSetup();
            }, function(err) {
                $data.warning = "Please check your wifi credentials";
                $data.processing = false;
            });
        }
        else {

            completeSetup();
        }
    }

    function completeSetup() {
        self.stor.sync();
        console.log("[index] importing data for region: " + self.vm.$data.region);
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
        processing: false,
        warning: ""
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
            self.vm.$data.warning = "";
            setTimeout(validateForm, 300);
        }
    }
    self = new LanternPage("index", opts, docs_to_preload);
    return self;
}());