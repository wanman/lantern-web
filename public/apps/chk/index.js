__base = "../../";

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


            // add birthday identifier but remove any previous ones saved
            var birthday_tag = [self.view.$data.birth_day, self.view.$data.birth_month].join("-");
            var tags = self.user.get("tag") || [];
            var final_tags = [];
            tags.forEach(function(tag) {
                if (tag.indexOf("chk:") == -1) {
                    final_tags.push(tag);
                }
            });
            final_tags.push("chk:"+birthday_tag);

            self.user.set("tag", final_tags);
            self.user.push("gp", self.geo);
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
        .then(self.getItems)
        .then(function(items) {
            if (items.length == 0 ) {
                window.location = "/";
            }
        })
        .then(function() {
            self.view.$data.page_title = "Safety Check";
            self.view.$data.page_loading = false;
            if (self.user.has("title")) {
                self.view.$data.initials = self.user.get("title");
            }
            if (self.user.has("status")) {
                self.view.$data.user_status = self.user.get("status");
            }

            var tags = self.user.get("tag") || [];
            tags.forEach(function(tag) {
                if (tag.indexOf("chk:") !== -1) {
                    tag = tag.replace("chk:", "");
                    var id = tag.split("-");
                    if (id.length == 2) {
                        self.view.$data.birth_month = id[0];
                        self.view.$data.birth_day = id[1];                        
                    }
                }
            });

        })
        .then(self.renderMap)
        .then(self.getUsers)
        .then(function(users) {
            self.map.removeZoomControl();
            self.view.$data.map_loaded = true;
            users.forEach(function(user) {
                // @todo show population counts and safety levels on map
                if (user.has("status") && user.has("geo") && user.get("geo")[0]) {
                    var coords = Geohash.decode(user.get("geo")[0]);
                    var point = self.map.addPoint(user.get("title"), {lat: coords.lat, lon: coords.lon}, "check", "6ae1c4", true);
                }
            });
        })
        .then(self.askForLocation)
        .then(function(position) {
            
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            self.geo = Geohash.encode(lat, lon, 4);
            self.map.setPosition(lat, lon, 12);
            var marker = self.map.addPoint("You Are Here", {lat: lat, lon: lon}, "user", null, true);

        });

    return self;

}());
