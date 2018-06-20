window.LanternSync = function LanternSync(src, dest, label, continuous, status_fn, change_fn) {
    var reset_delay;

    function setStatus(status) {
        if (status == true) {
            reset_delay = true;
        }
        if (status_fn && typeof(status_fn) == "function") {
            status_fn(status);
        }
    }

    // @todo expore pouchdb bug where this may be run twice
    function backOffSync(delay) {
        


        if (reset_delay) {
            console.log("[stor] " + label + " do reset delay");
            reset_delay = false;
            return 0;
        }
        
        setStatus(false);
        
        console.log("[stor] delaying " + label + " sync retry: " + delay);
        if (delay === 0) {
          return 3000;
        }
        return delay * 3;
    }

    console.log("[sync] start " + label + " sync...");
    src.sync(dest, {
        since: 0,
        live: continuous || false,
        retry: true,
        back_off_function: backOffSync
    })
    .on('complete', function() {
        console.log("[stor] started " + label + " sync");
        setStatus(true);
    })
    .on('paused', function(err) {
        if (err) {
            console.log("[stor] lost connection with " + label);
            setStatus(false);
        }
    })
    .on('active', function() {
        console.log("[stor] active " + label + " sync");
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