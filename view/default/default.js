window.default_view = (function() {

    //---------------------------------------------------------------- Vue App
    var opts = {
        methods: {},
        data: {
            active_user_count: 321
        },
        beforeMount: function() {
            console.log("[default] view initialized");
            // load interests
        }
    };
    var vm = new Vue(opts);
    vm.$mount('#default-app');

}());