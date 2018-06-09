window.page = (function() {
    
    var self = new LanternPage("network");




    //------------------------------------------------------------------------

    self.render()
        .then(self.connect)
        .then(function() {
            console.log("[network] init");
            self.stor.getManyByType("d").then(function(results) {
                console.log(results);
            });
        });
        

    return self;
}());