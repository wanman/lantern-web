window.LanternMapManager = function(lat, lon) {

    var self = {
        map: L.map('map')
    };

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: false
    }).addTo(self.map);

    self.map.zoomControl.remove();

    //------------------------------------------------------------------------
    self.addPoint = function(coords) {
        console.log("[map] adding point: ", coords);
        L.marker(coords).addTo(self.map);
    };
    
    self.addPolygon = function(coords) {
        console.log("[map] adding polygon: ",coords);
        L.polygon(coords).addTo(self.map);
    };
    
    self.setPosition = function(lat, lon, zoom) {
        console.log("[map] set position to:" + lat, lon);
        self.map.setView([lat, lon], zoom || 7);
    };



    //------------------------------------------------------------------------

    return self;
};