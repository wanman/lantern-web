window.LanternMapManager = function() {

    var self = {
        map: L.map('map'),
        markers: [],
        objects: [],
        user: null
    };

    function init() {

        var opts = {
            attribution: false,
            dbName: "map",
            maxZoom: 16,
            // always check PouchDB for map tiles
            useCache: true,
            // if we are definitely offline, don't try network requests
            useOnlyCache: (window.location.hostname != "lantern.global"),
            cacheMaxAge: 365*24*3600*1000,
            crossOrigin: true
        };

        L.tileLayer('https://maps.tilehosting.com/c/ade1b05a-496f-40d1-ae23-5d5aeca37da2/styles/streets/{z}/{x}/{y}.png?key=ZokpyarACItmA6NqGNhr', opts).addTo(self.map);

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

    self.addPoint = function(title, coords,  icon, color, draggable) {

        var opts = {};
        icon = icon || "info-circle";
        color = "#"+ (color || "3273dc");

        opts.icon = L.icon.fontAwesome({ 
            iconClasses: 'fa fa-' + icon, // you _could_ add other icon classes, not tested.
            markerColor: color,
            iconColor: '#FFF'
        });        

        opts.draggable = (draggable ? true : false);

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
        var circle = L.circle(coords, opts || {}).addTo(self.map);

        if (opts.draggable) {
            circle.on('mousedown', function (event) {
              //L.DomEvent.stop(event);
              self.map.dragging.disable();
              let {lat: circleStartingLat, lng: circleStartingLng} = circle._latlng;
              let {lat: mouseStartingLat, lng: mouseStartingLng} = event.latlng;
              self.map.on('mousemove', event => {
                let {lat: mouseNewLat, lng: mouseNewLng} = event.latlng;
                let latDifference = mouseStartingLat - mouseNewLat;
                let lngDifference = mouseStartingLng - mouseNewLng;

                let center = [circleStartingLat-latDifference, circleStartingLng-lngDifference];
                circle.setLatLng(center);
              });
            });

            self.map.on('mouseup', () => { 
              self.map.dragging.enable();
              self.map.removeEventListener('mousemove');
            });
        }

        return circle;
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