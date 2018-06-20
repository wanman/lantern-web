window.LanternMapManager = function() {

    var self = {
        map: L.map('map'),
        markers: []
    };

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: false,
        dbName: "lantern",
        maxZoom: 18,
        useCache: true,
        crossOrigin: true
    }).addTo(self.map);


    //------------------------------------------------------------------------
    self.addPoint = function(coords,  icon, color) {

        var opts = {};
        icon = icon || "info-circle";
        color = "#"+ (color || "3273dc");

        opts.icon = L.icon.fontAwesome({ 
            iconClasses: 'fa fa-' + icon, // you _could_ add other icon classes, not tested.
            markerColor: color,
            iconColor: '#FFF'
        });        

        var marker = L.marker(coords, opts).addTo(self.map);
        self.markers.push(marker);
        return marker;
    };
    
    self.addPolygon = function(coords, opts) {
        //console.log("[map] adding polygon: ", coords);
        return L.polygon(coords, opts || {}).addTo(self.map);
    };

    self.addCircle = function(coords, opts) {
        //console.log("[map] adding circle: ", coords);
        return L.circle(coords, opts || {}).addTo(self.map);
    };
    
    self.setPosition = function(lat, lon, zoom) {
        //console.log("[map] set position to:" + lat, lon);
        self.map.setView([lat, lon], zoom || 11);
    };

    self.fitToMarkers = function() {
        var group = new L.featureGroup(self.markers);
        self.map.fitBounds(group.getBounds());
    };


    self.setPosition(38.42,-102.79, 4);

    //------------------------------------------------------------------------

    return self;
};