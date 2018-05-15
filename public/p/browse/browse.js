window.page = (function() {

    var self;
    var opts = {};

    function addVenue(venue_doc) {
        venue_doc.$child = [];
        self.vm.$data.venues.push(venue_doc);
        // @todo more efficient search
        for (var idy in self.vm.$data.s_docs) {
            var supply_doc = self.vm.$data.s_docs[idy];
            if (supply_doc.parent == venue_doc._id) {
                venue_doc.$child.push(supply_doc);
            }
        }
    }


    opts.methods = {
      
        toggleCategory: function(evt) {
            var el = evt.target;
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
            self.user.save();
        },
        makeCategoryClass: function(cat) {
            var cls = "";
            var user = self.user;
            if (user && user.has("tag", cat._id)) {
                cls += "active ";
            }
            return cls;
        },
        makeCategoryStyle: function(cat) {
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
        },
        handleShowReportView: function() {
            window.location = "/p/report/report.html";
        },
        handleCloseFilterView: function() {
            self.vm.$data.show_filter = false;
        },
        handleToggleFilterView: function() {
            self.vm.$data.show_filter = !self.vm.$data.show_filter;
        }
    };


    opts.data = {
        venues: [],
        show_filter: false
    };

    var preload = ["v", "c", "u", "s"];

    for (var idx in preload) {
        opts.data[preload[idx] +"_docs"] = [];
    }


    opts.beforeMount = function() {
        console.log("[browse] check for data");


        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/p/index/index.html";
        }
        
        console.log("[browse] rendering map");
    
        mapboxgl.accessToken = 'pk.eyJ1IjoiamYiLCJhIjoiY2poN3g4bGI3MGN0NzJ3dnQyMWhmNHlrMSJ9._Xs4n5t5UPMip2qPKBF1-w';

        var map = new mapboxgl.Map({
            container: "map",
            style: 'mapbox://styles/mapbox/light-v9',
            center: [ -73.212074, 44.475883],
            zoom: 4
        });

        for (var idx in self.vm.$data.v_docs) {
            addVenue(self.vm.$data.v_docs[idx]);
        }
    };


    self = new LanternPage("browse", opts, preload);
    return self;
}());