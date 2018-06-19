__base = "../";

window.page = (function() {
    var self = new LanternPage("checkin");

    self.addData("show_form", true);
    self.addData("user_status", "");
    self.addData("initials", "");
    self.addData("birth_month", "");
    self.addData("birth_day", "");
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
            });
        }, 1000);
    });

    self.addHelper("handleReturnHome", function() {
        window.location = "/";
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
        });

    return self;

}());
