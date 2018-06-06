window.LanternMapManager = function() {
    
    var did_render = false;

    var self = {
        map: L.map('map')
    };

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: false
    }).addTo(self.map);

    self.map.zoomControl.remove();

    function render(lat, lon) {
        if (did_render) {
            return;
        }

        did_render = true;
    }


    function geo_success(position) {
        console.log("[map] found position", position);
        self.setPosition(position.coords.latitude, position.coords.longitude);
    }

    function geo_error() {
        console.log("[map] no position available");
    }

    var geo_options = {
      enableHighAccuracy: true, 
      maximumAge        : 30000, 
      timeout           : 27000
    };

    //------------------------------------------------------------------------
    self.addPoint = function(coords) {
        console.log("[map] adding point: ", coords);
        L.marker(coords).addTo(self.map);
    };
    
    self.addPolygon = function(coords) {
        console.log("[map] adding polygon: ",coords);
        L.polygon(coords).addTo(self.map);
    };
    
    self.setPosition = function(lat, lon) {
        console.log("[map] set position to:" + lat, lon);
        self.map.setView([lat, lon], 7);
    };



    //------------------------------------------------------------------------
    var wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);

    return self;
};