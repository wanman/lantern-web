window.LanternSync = function LanternSync(src, dest, label, continuous, status_fn, change_fn, batch_size) {
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
            reset_delay = false;
            return 0;
        }
        
        //console.log("[" + label + "] retry sync in: " + delay);
        if (delay === 0) {
          return 3000;
        }
        return delay * 3;
    }

    var opts =  {
        since: 0,
        batch_size: batch_size || 500,
        live: continuous || false,
        retry: true,
        back_off_function: backOffSync
    };

    
    var replication_handler = src.sync(dest, opts);

    replication_handler
    .on('paused', function(err) {
        if (err) {
            console.log("[db:" + label +"] lost connection");
            setStatus(false);
        }
    })
    .on('active', function() {
        //console.log("[db:" + label + "] active sync");
        setStatus(true);
    })
    .on('change', function (info) {
        setStatus(true);
        if (change_fn && typeof(change_fn) == "function") {
            if (info.change.docs) {
                console.log("[db:" + label + "] %s: %s docs", 
                        info.direction, 
                        info.change.docs.length);
                info.change.docs.forEach(change_fn);            
            }
        }

    })
    .on('error', function (err) {
        console.log("[db:" + label + "] sync err", err);
    });


    if (continuous) {
        // make sure to cancel any outstanding replication
        window.addEventListener('beforeunload', function(event) {
            try {
                replication_handler.cancel();

                console.log("[db:" + label + "] stop sync");
            }
            catch(e) {
                console.log("failed to stop sync", label);
            }
        });
    }
    
    return replication_handler;
};