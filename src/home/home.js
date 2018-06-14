window.page = (function() {

    var self = new LanternPage("home");

    //------------------------------------------------------------------------


    self.addHelper("handleCategorySelect", function(cat) {
        self.view.$data.personalizing = true;
        setTimeout(function() {
            window.location = "/browse/browse.html?cat="+cat.slug;
        }, 500);
    });

    self.addHelper("handleAllCategorySelect", function() {
        window.location = "/browse/browse.html";
    });

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
    self.addData("item_categories", []);
    self.addData("personalizing", false);



    //------------------------------------------------------------------------
    self.render()
        .then(function() {
            self.view.$data.page_title = "Home";
        })
        .then(self.connect)
        .then(function() {
            // draw category grid
            return self.stor.getManyByType("c").then(function(categories) {  
                categories.forEach(function(cat) {
                    if (cat.has("tag", "itm")) {
                        self.view.$data.item_categories.push(cat.toJSONFriendly());
                    }
                });
            });

        })
        .then(function() {
            // draw listening user count
            return self.stor.getManyByType("u");
        });
        
    return self;
}());