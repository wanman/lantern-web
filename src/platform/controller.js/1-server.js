LX.Server = (function() {

    // default cross-domain JSON request options
    var _fetch_opts = {
         mode: "cors",
         cache: "no-cache",
         headers: {
            "Content-Type": "application/json; charset=utf-8"
         }
    };

    var self = {
    	cloud: false,
    	lantern: false,
    	info: null,
    	uri: null
    };

    self.connect = function(domain) {
    	var uri = window.location.protocol + "//" + domain;
	    return fetch(uri + "/api/info", _fetch_opts)
	        .then(function(result) {
	            return result.json();
	        })
	        .then(function(json) {
	            self.uri = uri;
	            self.info = json;
	            try {
	                self.cloud = (json.cloud == true);
	                self.lantern = (json.cloud == false);                    
	            }
	            catch(e) {
	                // if missing "cloud" value, leave defaults...
	            }
	            console.log("[server] connected:", self);
	            
	        })
	        .catch(function(err) {
	            console.log(err);
	            if (window.location.hostname == "localhost" && domain == "lantern.global") {
	                // allow developers to use localhost docker image
	                return self.connect("localhost");
	            }
	        });
	}

	return self;
});