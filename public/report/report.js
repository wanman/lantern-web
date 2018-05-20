window.page = (function() {

    var opts = {};
    opts.beforeMount = function() {
        if (!self.vm.$data.c_docs.length) {
            window.location.href = "/";
        }
    };

    opts.methods = {
        handleReportSupply: function() {

            console.log("[report] report a supply");
        },
        handleReportShelter: function() {
            console.log("[report] report a shelter");

        },
        handleReportCondition: function() {
            console.log("[report] report a condition");

        }
    };

    var self = new LanternPage("report", opts, ["c"]);
    return self;
}());