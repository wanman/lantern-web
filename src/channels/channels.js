window.page = (function() {

    var self = new LanternPage("channels");

    //------------------------------------------------------------------------


    self.addHelper("toggleCategory", function(cat) {
        var cat_label = cat._id.substr(2, cat._id.length);

        console.log("[channel] toggle cat: " + cat_label);
        // do optimistic UI updates and then listen for sync to confirm
        if (self.user.has("tag", cat_label)) {
            self.user.pop("tag", cat_label);
        }
        else {
            self.user.push("tag", cat_label);
        }
        self.view.$data.personalizing = true;
        self.user.save().then(function() {
            setTimeout(function() {
                self.view.$data.personalizing = false;
            }, 1500);
        });
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
            self.view.$data.page_title = "Requests";
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