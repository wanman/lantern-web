window.page = (function() {

    var self = new LanternPage("channels");

    //------------------------------------------------------------------------
    self.addHelper("makeCategoryStyle", function(cat) {
        var obj;

        if (!cat) {
            return;
        }

        if (typeof(cat) == "string") {
            obj = self.stor.getCached(cat);
        }
        else {
            obj = cat;
        }

        if (obj.hasOwnProperty("parent")) {
            // must be a specific supply
            obj = self.stor.getCached(obj.tag[0]);
        }

        var doc = new LanternDocument(obj, self.stor);
        var style = ["color: #" + doc.get("style","color")];
        style.push("background-color: #" + doc.get("style", "background-color"));
        style.push("border-color: #" + doc.get("style", "color"));
        return style.join("; ");
    });

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
    self.addData("item_tags", []);
    self.addData("personalizing", false);



    //------------------------------------------------------------------------
    self.render()
        .then(self.connect)
        .then(function() {

            // draw category grid
            self.stor.getManyByType("t").then(function(tags) {  
                tags.forEach(function(tag) {
                    if (tag.has("tag", "i")) {
                        self.view.$data.item_tags.push(tag.toJSONFriendly());
                    }
                });
            });

        });
        
    return self;
}());