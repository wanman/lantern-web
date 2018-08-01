window.LanternMapManager = function() {

    var self = {
        map: L.map('map'),
        markers: [],
        objects: [],
        user: null
    };


    function init() {
        L.tileLayer('https://maps.tilehosting.com/c/ade1b05a-496f-40d1-ae23-5d5aeca37da2/styles/streets/{z}/{x}/{y}.png?key=ZokpyarACItmA6NqGNhr', {
            attribution: false,
            dbName: "map",
            maxZoom: 16,
            useCache: true,
            crossOrigin: true,
            noWrap: true
        }).addTo(self.map);

        // default to center of US as starting location for map
        self.setPosition(38.42,-102.79, 4);
        self.markers = [];
        self.objects = [];
    }


    //------------------------------------------------------------------------

    self.clear = function() {
        self.map.eachLayer(function (layer) {
            self.map.removeLayer(layer);
        });
        init();
    };

    self.addPoint = function(title, coords,  icon, color) {

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
        self.objects.push(marker);
        return marker;
    };
    
    self.addPolygon = function(title, coords, opts) {
        //console.log("[map] adding polygon: ", coords);
        return L.polygon(coords, opts || {}).addTo(self.map);
    };

    self.addCircle = function(title, coords, opts) {
        //console.log("[map] adding circle: ", coords);
        return L.circle(coords, opts || {}).addTo(self.map);
    };
    

    self.setPosition = function(lat, lon, zoom) {
        //console.log("[map] set position to:" + lat, lon);
        self.map.setView([lat, lon], zoom || 11);
    };

    self.fitToMarkers = function() {
        if (self.markers.length) {
            var group = new L.featureGroup(self.markers);
            self.map.fitBounds(group.getBounds(), {padding: [50,50]});            
        }
    };


    self.fitAll = function() {
        var group = new L.featureGroup(self.objects);
        self.map.fitBounds(group.getBounds());
    };

    self.removeZoomControl = function() {
        self.map.removeControl(self.map.zoomControl);
    };

    self.addZoomControl = function() {
        self.map.addControl(self.map.zoomControl);
    };

    self.setOwnLocation = function(coords) {
        if (self.user) {
            self.user.setLatLng(coords);
        }
        else {
            self.user = L.circle(coords).addTo(self.map);
            self.objects.push(self.user);
        }
    
        return self.user;
    };


    //------------------------------------------------------------------------
    init();
    return self;
};