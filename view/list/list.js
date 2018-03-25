window.list_view = (function() {


    var self = {};

    //---------------------------------------------------------------- Vue App
    var opts = {
        methods: {},
        data: {
            docs: []
        },
        beforeMount: function() {
            console.log("[list] view initialized");
        }
    };
    var vm = new Vue(opts);
    vm.$mount('#list-app');

    var db = new LanternStore();
    db.local.allDocs().then(function(result) {
        vm.$data.docs = result.rows;
    });

    return self;
    
}());