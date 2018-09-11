__base = "/";

window.page = (function() {

    var self = new LX.Page("home");
    var $data;

    
    //------------------------------------------------------------------------
    self.addData("apps", [
        {"title": "Supplies", "id": "rdr", "icon": "box", "text": "Find nearby water, power and more"},
        {"title": "Safety Check", "id": "chk", "icon": "thumbtack", "text": "Let loved ones know you are safe"},
        {"title": "Report", "id": "rpt", "icon": "clipboard", "text": "Help verify local conditions"},
        {"title": "Network", "id": "net", "icon": "globe-americas", "text": "See who else is connected"},
        {"title": "Notes", "id": "ote", "icon": "sticky-note", "text": "Post messages for community"}
    ]);

    self.addHelper("goToApp", function(id) {
        window.location = "/apps/" + id + "/";
    });

    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            $data = self.view.$data;
            $data.page_title = "Home";
        })
        .then(self.connect)
        .then(self.getVenues)
        .then(function() {
            $data.page_loading = false;

            // backup check for new data in case sync fails
            // @todo fix bug where change log is trigger for just 1 document
            setInterval(function() {
                if (!self.view.$data.v_docs.length) {
                    self.getVenues();
                }
            }, 2000);
        });
        
    return self;
}());
