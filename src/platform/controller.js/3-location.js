LX.Location = (function() {

    // geolocation options
    var _opts = {
        enableHighAccuracy: false, 
        maximumAge        : 30000, 
        timeout           : 27000
    };

    var self = {};

    // @todo fall-back to lantern geolocation if GPS sensor not available
    self.getCurrentPosition = function() {
        return new Promise(function(resolve, reject) {
            //console.log("[page] asking for location");
            navigator.geolocation.getCurrentPosition(function(position) {
                resolve(position);
            }, function(err) {
                reject(err);
            }, _opts);
        });
    };

    return self;
})();