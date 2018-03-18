window.home_view = (function() {

    //---------------------------------------------------------------- Vue App
    var opts = {
        methods: {},
        data: {},
        beforeMount: function() {
            console.log("[index] view initialized");
        }
    };
    var vm = new Vue(opts);
    vm.$mount('#default-app');

}());