if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register('/sw.js', {
        scope: "/"
    }).then(function() {
        // success
        console.log("[sw] registered");
    }).catch(function(e) {
        // failed
        console.log("[sw] err", e);
    });
}