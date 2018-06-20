window.page = (function() {
    var self = new LanternPage("checkin");

    self.addData("show_form", true);
    self.addData("user_status", "");
    self.addData("initials", "");
    self.addData("birth_month", "");
    self.addData("birth_day", "");
    self.addData("confirmation_count", 0);
    self.addData("sending_data", false);

    self.addHelper("handleSubmit", function() { 
        self.view.$data.sending_data = true;
        setTimeout(function() {
            self.user.set("status", self.view.$data.user_status);
            self.user.set("title", self.view.$data.initials);
            var birthday_tag = [self.view.$data.birth_day, self.view.$data.birth_month].join("-");
            self.user.push("tag",  birthday_tag);
            self.user.save().then(function() {
                self.view.$data.show_form = false;
                self.view.$data.sending_data = false;

                var iv = setInterval(function() {
                    if (self.view.$data.confirmation_count < 5) {
                        self.view.$data.confirmation_count = self.view.$data.confirmation_count+1;
                    }
                    else {
                        clearInterval(iv);
                    }
                }, 3000+Math.random()*5000);
            });
        }, 300);
    });

    self.addHelper("handleReturnHome", function() {
        window.location = "/index.html";
    });

    self.render()
        .then(self.connect)
        .then(function() {
            self.view.$data.page_title = "Safety Check-In";
            self.view.$data.page_loading = false;
            if (self.user.has("title")) {
                self.view.$data.initials = self.user.get("title");
            }
            if (self.user.has("status")) {
                self.view.$data.user_status = self.user.get("status");
            }
        })
        .then(function() {
            self.renderMap()
                .then(function(map) {
                    map.removeZoomControl();
                })
                .then(self.askForLocation)
                .then(function(position) {
                    self.view.$data.map_loaded = true;
                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;

                    // @todo use more precision (demo preserves privacy)
                    var hash = Geohash.encode(lat, lon, 3);
                    
                    self.user.push("gp", hash);
                    self.map.setPosition(lat, lon, 12);
                    var marker = self.map.addPoint({lat: lat, lon: lon}, {
                        draggable: false
                    });
                });
        });

    return self;

}());