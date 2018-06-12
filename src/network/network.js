window.page = (function() {
    
    var self = new LanternPage("network");

    //------------------------------------------------------------------------
    self.addHelper("pluralize", function(count) {
        if (count === 0) {
            return 'No Users';
        } 
        else if (count === 1) {
            return '1 User';
        } else {
            return count + ' Users';
        }
    });



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