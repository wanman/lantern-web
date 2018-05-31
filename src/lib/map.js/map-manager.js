window.LanternMapManager = function() {

    mapboxgl.accessToken = 'pk.eyJ1IjoiamYiLCJhIjoiY2poN3g4bGI3MGN0NzJ3dnQyMWhmNHlrMSJ9._Xs4n5t5UPMip2qPKBF1-w';

    var self = {};

    self.render = function() {
        var map = new mapboxgl.Map({
            container: "map",
            style: 'mapbox://styles/mapbox/light-v9',
            center: [ -73.212074, 44.475883],
            zoom: 4
        }); 
    };
    
    return self;
};