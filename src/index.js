window.page = (function() {

    var self = new LanternPage("home");
    var $data;

    
    //------------------------------------------------------------------------
    self.addData("apps", [
        {"title": "Supplies", "id": "rdr", "icon": "map", "text": "Find nearby water, power and more"},
        {"title": "Checkin", "id": "chk", "icon": "thumbtack", "text": "Let loved ones know you are safe"},
        {"title": "Report", "id": "rpt", "icon": "clipboard", "text": "Help verify local conditions"},
        {"title": "Network", "id": "net", "icon": "globe-americas", "text": "See who else is connected"},
    ]);

    self.addHelper("goToApp", function(id) {
        window.location = "/apps/" + id + "/";
    });



    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            $data = self.view.$data;
        })
        .then(self.connect)
        .then(function() {
            $data.page_title = "Lantern Network";
        })
        .then(self.getVenues)
        .then(self.getDevices)
        .then(function() {
            $data.page_loading = false;
        });
        
    return self;
}());