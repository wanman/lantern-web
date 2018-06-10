__base = "../";

window.page = (function() {
    
    var self = new LanternPage("network");




    //------------------------------------------------------------------------

    self.render()
        .then(function() {
            self.view.$data.page_title = "Network";
        })
        .then(self.connect)
        .then(function() {
          
            console.log("[network] init");
            self.stor.getManyByType("d").then(function(results) {
                console.log(results);
            });  
            self.stor.getManyByType("u").then(function(results) {
                self.view.$data.page_loading = false;
            });
        });
        

    return self;
}());
