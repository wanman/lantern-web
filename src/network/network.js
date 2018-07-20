window.page = (function() {
    var self = new LanternPage("network");


    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(self.getDevices)
        .then(function(results) {
            console.log(results);
            self.view.$data.page_title = "Network";
            self.view.$data.page_loading = false;
        });
    return self;
})();