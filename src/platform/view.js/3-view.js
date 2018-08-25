LX.View = (function(data,methods) {


    // define a few variables that are always used for any application
    var _global_data =  {
        // are we connected to cloud-hosted database
        cloud_connected: null,

        // are we connected to a nearby wireless device
        lantern_connected: null,

        // info about the device we are connected to
        lantern: {},

        // is page currently loading data? if so, don't display all elements
        page_loading: true,

        // are we syncing data? if so, show sync indicator
        is_syncing: false,

        // what does sync indicator display?
        sync_label: "Syncing",

        // show a back button?
        allow_back_button: false,

        // this user
        user: null,

        // show global navigation?
        showNavMenu: false,

        // page-specific details
        page_title: "",
        page_tag: "",     
        page_action_icon: "",
        page_action_helper: null
    };

    // initialize arrays for each type of doc
    // only these document types will ever be accepted by the system
    (["v", "i", "c", "r", "n", "u", "d"]).forEach(function(type) {
        _global_data[type+"_docs"] = [];
    });


    // define helper / template methods that are always used across apps
    var _global_methods = {
        /**
        * Make sure we have a most recent timestamp to work with
        */
        timestamp: function(item) {
            var timestamp = item.updated_at || item.created_at || item.imported_at;
            if (timestamp) {
                return moment(timestamp).fromNow();
            }
        }
    }

	return new Vue({
        data: Object.assign(data, _global_data),
        methods: Object.assign(methods, _global_methods)
    });
});