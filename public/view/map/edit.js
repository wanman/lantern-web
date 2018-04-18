window.app = (function() {

    var self = {};
    var vue_opts = {
        methods: {},
        data: {
            c_docs: [],
        },
        beforeMount: function() {
            console.log("[edit] view initialized");
        }
    };
    self.vm = new Vue(vue_opts);
    self.store = new LanternStore(self.vm.$data);
    self.store.setup(["c"]).then(function() {
        self.vm.$mount('#edit-app');
    });
    return self;
}());