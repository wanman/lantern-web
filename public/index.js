__base = "/";

window.page = (function() {

    var self = new LanternPage("home");

    function redirectToFirstApp() {
        window.location = "/apps/rdr/";  
    }

    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(self.getVenues)
        .then(function(venues) {
            if (venues.length === 0) {
                // if we have zero venues, we probably are missing data
                console.log("[home] importing sample data...");   
                var imp = new LanternImport(self.stor);
                imp.all();
                setTimeout(redirectToFirstApp, 1000);
            }
            else {
                redirectToFirstApp();
            }
        });
        
    return self;
}());
