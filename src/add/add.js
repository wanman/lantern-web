window.page = (function() {
    var self = new LanternPage("add");

    var new_doc;

    //------------------------------------------------------------------------
    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    


    function askForLocation() {

        function geo_success(position) {
            console.log("[add] found position", position);
            renderMap(position.coords.latitude, position.coords.longitude);
        }

        function geo_error() {
            console.log("[add] no position available");
        }

        console.log("[add] asking for location");
        var geo_options = {
          enableHighAccuracy: true, 
          maximumAge        : 30000, 
          timeout           : 27000
        };

        navigator.geolocation.getCurrentPosition(geo_success, geo_error, geo_options);
    }


    function renderMap(lat, lon) {
        console.log("[add] showing map");
        map = new LanternMapManager(lat, lon);
        map.setPosition(lat, lon, 12);
    }

    function setupMapSelector(tag, label) {
        console.log("[add] " + label + " form");
        new_doc.push("tag", "adr");
        console.log(new_doc);
        self.view.$data.show_input_selector = false;
        self.view.$data.show_subcategory_selector = false;
        self.view.$data.show_map_selector = true;
        askForLocation();
    }


    //------------------------------------------------------------------------
    self.addHelper("handleShowInputSelector", function(subcategory) {
        console.log(subcategory);
        new_doc.push("category", subcategory._id);
        
        self.view.$data.show_subcategory_selector = false;
        self.view.$data.show_input_selector = true;
    });

    self.addHelper("presentAddressForm", function() {
        setupMapSelector("adr", "address");
    });

    self.addHelper("presentAreaForm", function() {
        setupMapSelector("ara", "area");
    });

    self.addHelper("presentLineForm", function() {
        setupMapSelector("lne", "line");
    });


    //------------------------------------------------------------------------
 
    self.addData("category", null);
    self.addData("subcategories", []);
    self.addData("show_subcategory_selector", false);
    self.addData("show_input_selector", false);
    self.addData("show_map_selector", false);

    //------------------------------------------------------------------------
    
    var param = getParameterByName("ct");

    if(!param) {
        // missing category
        // @todo let user know and offer next step recovery
        window.location = "/";
        return;
    }

    self.render()
        .then(self.connect)
        .then(function() {
            
            new_doc = new LanternDocument( "m:" + Math.round(Math.random()*100000), self.stor);
            new_doc.push("category", param);


            self.stor.get(param).then(function(result) {
                console.log(result);
                self.view.$data.category  = result.toJSONFriendly();
                self.stor.getManyByType("c").then(function(results) {

                    results.forEach(function(cat) {
                        // find subcategories
                        if (cat.has("tag", param.split(":")[1])) {
                            self.view.$data.subcategories.push(cat.toJSONFriendly());
                        }
                    });  

                     if (self.view.$data.subcategories == 0 ) {
                        console.log("[add] no available subcategories for category:", param);
                        console.log("[add] skipping ahead to input selector...");
                        self.view.$data.show_input_selector = true;
                    }   
                    else {
                        self.view.$data.show_subcategory_selector = true;
                    }        
                });
            });
        });

    return self;
}());
