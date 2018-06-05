window.LanternMapManager = function() {

    var self = {};
    var did_render = false;

    function render(lat, lon) {
        if (did_render) {
            return;
        }

        did_render = true;
        var map = L.map('map').setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: false
        }).addTo(map);

        // L.marker([51.5, -0.09]).addTo(map)
        //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();
    }


    function geo_success(position) {
        render(position.coords.latitude, position.coords.longitude);
    }

    function geo_error() {
        console.log("no position available");
    }

    var geo_options = {
      enableHighAccuracy: true, 
      maximumAge        : 30000, 
      timeout           : 27000
    };

    var wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);

    return self;
};