window.page = (function() {
    var self;   
    var docs_to_preload = [];


    function validateForm() {
        var $data = self.vm.$data;
        
        $data.processing = true;

        if ($data.connection == null) {
            $data.warning = "Please enter your connection type";
            $data.processing = false;
            return;
        }
        else if ($data.region == "") {
            $data.warning = "Please select your geographical region";
            $data.processing = false;
            return;
        }
        
        self.user.set("status", $data.connection);
        self.user.save();

        if ($data.connection == 1) {
            console.log("[settings] storing wifi credentials...");
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
        console.log("[settings] importing data for region: " + self.vm.$data.region);
        var importer = new LanternImport(self.stor);
        importer.all();

        
        setTimeout(function() {
            window.location = "/browse/browse.html";
        }, 1000);
    }

    var opts = {};

    opts.data = {
        connection: null,
        region: "",
        network_ssid: "",
        network_pass: "",
        processing: false,
        warning: ""
    };

    opts.watch = {
        connection: function(val) {
            console.log("[settings] connection input: " + val);
        },
        region: function(val) {
            console.log("[settings] region input: " + val);
        }
    };

    opts.methods = {
        handleSubmit: function() {
            self.vm.$data.warning = "";
            self.vm.$data.processing = true;
            setTimeout(validateForm, 150);
        }
    };
    self = new LanternPage("settings", opts, docs_to_preload);
    return self;
}());