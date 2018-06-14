window.LanternMapManager = function() {

    var self = {
        map: L.map('map')
    };

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: false
    }).addTo(self.map);

    self.map.zoomControl.remove();

    //------------------------------------------------------------------------
    self.addPoint = function(coords, opts) {
        console.log("[map] adding point: ", coords);
        return L.marker(coords, opts || {}).addTo(self.map);
    };
    
    self.addPolygon = function(coords, opts) {
        console.log("[map] adding polygon: ", coords);
        return L.polygon(coords, opts || {}).addTo(self.map);
    };

    self.addCircle = function(coords, opts) {
        console.log("[map] adding circle: ", coords);
        return L.circle(coords, opts || {}).addTo(self.map);
    };
    
    self.setPosition = function(lat, lon, zoom) {
        console.log("[map] set position to:" + lat, lon);
        self.map.setView([lat, lon], zoom || 11);
    };


    self.setPosition(38.42,-102.79, 4);

    //------------------------------------------------------------------------

    return self;
};