__base = "../";

window.page = (function() {
    
    var self = new LanternPage("network");


    //------------------------------------------------------------------------
    function validateForm() {
        var $data = self.view.$data;
        
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
            console.log("[network] storing wifi credentials...");
            self.view.$http.post(self.base_uri + "/api/config/ssid", {
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
        console.log("[network] importing data for region: " + self.view.$data.region);
        var importer = new LanternImport(self.stor);
        importer.all();

        
        setTimeout(function() {
            window.location = "/browse/browse.html";
        }, 1000);
    }
    


    //------------------------------------------------------------------------
    self.addData("connection", null);
    self.addData("region", "");
    self.addData("network_ssid", "");
    self.addData("network_pass", "");
    self.addData("processing", false);
    self.addData("warning", "");
    self.addData("network_status", -1);

    

    //------------------------------------------------------------------------
    self.addHelper("handleSubmit", function() {
        self.view.$data.warning = "";
        self.view.$data.processing = true;
        setTimeout(validateForm, 150);
    });



    //------------------------------------------------------------------------

    self.render()
        .then(self.connect)
        .then(function() {
            console.log("[network] init");
            self.stor.getManyByType("d").then(function(devices) {
                console.log(devices);
            });
        });
        

    return self;
}());
