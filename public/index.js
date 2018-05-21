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
        setTimeout(function() {
            window.location = "/welcome/welcome.html?cn="+self.vm.$data.connection+"&rg="+self.vm.$data.region;
        }, 300);
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
            console.log("[index] connection input: " + val);
        },
        region: function(val) {
            console.log("[index] region input: " + val);
        }
    };

    opts.methods = {
        handleSubmit: function() {
            self.vm.$data.warning = "";
            self.vm.$data.processing = true;
            setTimeout(validateForm, 150);
        }
    };
    self = new LanternPage("index", opts, docs_to_preload);
    return self;
}());