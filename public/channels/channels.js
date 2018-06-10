__base = "../";

window.page = (function() {

    var self = new LanternPage("channels");

    //------------------------------------------------------------------------


    self.addHelper("makeCategoryClass", function(cat) {
        var cls = "";
        var user = self.user;
        if (user && user.has("tag", cat._id)) {
            cls += "active ";
        }
        return cls;
    });


    self.addHelper("toggleCategory", function(evt) {
        var el = evt.target;
        if (!el.getAttribute("id")) {
            el = el.parentElement;
        }
        
        var cat = el.getAttribute("id");
        console.log("[browse] clicked: " + cat);

        // do optimistic UI updates and then listen for sync to confirm
        if (self.user.has("tag", cat)) {
            self.user.pop("tag", cat);
            el.classList.remove("active");
        }
        else {
            el.classList.add("active");
            self.user.push("tag", cat);
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
            self.stor.getManyByType("c").then(function(categories) {  
                categories.forEach(function(cat) {
                    if (cat.has("tag", "itm")) {
                        self.view.$data.item_categories.push(cat.toJSONFriendly());
                    }
                });
            });

        });
        
    return self;
}());
