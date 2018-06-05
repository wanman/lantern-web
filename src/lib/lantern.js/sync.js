window.LanternSync = function LanternSync(src, dest, label, continuous, status_fn, change_fn) {

    function setStatus(status) {
        self[label + "_connected"] = status;
        if (status_fn && typeof(status_fn) == "function") {
            status_fn(self[label + "_connected"]);
        }
    }

    src.sync(dest, {
        live: continuous || false,
        retry: true,
        back_off_function: function backOffSync(delay) {
            console.log("[stor] delaying " + label + " sync retry: " + delay);
            self.lantern_connected = false;
            if (delay === 0) {
              return 3000;
            }
            return delay * 3;
        }
    })
    .on('complete', function() {
        console.log("[stor] started " + label + " sync");
        setStatus(true);
    })
    .on('paused', function() {
        console.log("[stor] paused " + label + " sync");
    })
    .on('active', function() {
        console.log("[stor] resumed " + label + " sync");
        setStatus(true);
    })
    .on('change', function (info) {
        setStatus(true);
        if (info.change.docs) {
            console.log("[stor] did %s to " + label + " database: %s docs", 
                    info.direction, 
                    info.change.docs.length);
            for (var idx in info.change.docs) {
                change_fn(info.change.docs[idx]);
            }
        }
    })
    .on('error', function (err) {
        console.log("[stor] sync " + label + "err", err);
    });
};