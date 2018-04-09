window.app = (function() {

    var render = {};

    var self = {};

    var vue_opts = {
        methods: {},
        data: {
            p_docs: []
        },
        beforeMount: function() {
            console.log("[list] view initialized");
        }
    };

    self.vm = new Vue(vue_opts);
    self.vm.$mount('#list-app');

    self.store = new LanternStore(self.vm.$data);
    self.store.setup(["p", "r"]);



    return self;
    
}());