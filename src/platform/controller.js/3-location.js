LX.Location = (function() {

    var _last_known_position;
    var _last_known_geohash;

    // geolocation options
    var _opts = {
        enableHighAccuracy: false, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    var self = {};

    // @todo fall-back to lantern geolocation if GPS sensor not available
    self.getCurrentPosition = function(use_saved_location) {
        return new Promise(function(resolve, reject) {

            if (use_saved_location && _last_known_position) {
                return resolve(_last_known_position);
            }

            //console.log("[page] asking for location");
            navigator.geolocation.getCurrentPosition(function(position) {
                _last_known_position = position;
                var geo = Geohash.encode(position.coords.latitude, position.coords.longitude);
                var short_geo = geo.substr(0,4); // reduce geohash precision for privacy
                _last_known_geohash = short_geo;
                resolve(position);
            }, function(err) {
                reject(err);
            }, _opts);
        });
    };


    self.getCurrentGeohash = function(use_saved_location) {
        return self.getCurrentPosition(use_saved_location)
            .then(function(position) {
                return _last_known_geohash;
            });
    }

    self.getPositionFrom = function(geo) {
        return Geohash.decode(geo);
    }

    self.getDistanceFrom = function(geo) {
        return Math.round(Geohash.inKm(geo, _last_known_geohash));
    }

    return self;
})();