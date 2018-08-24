LX.Worker = (function() {
	return {
		register: function() {
			if ("serviceWorker" in navigator) {
			    navigator.serviceWorker.register('/worker/sw.js', {
			        scope: "/"
			    }).then(function(registration) {
			        // success
			        console.log("[sw] registered service worker");
			    }).catch(function(e) {
			        // failed
			        console.log("[sw] service worker err", e);
			    });
			}
		}
	}
});