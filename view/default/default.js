window.app = (function() {

    var self = {};
    var vue_opts = {
        methods: {},
        data: {
            r_docs: [],
            active_user_count: 321,
        },
        beforeMount: function() {
            console.log("[default] view initialized");
        }
    };
    self.vm = new Vue(vue_opts);
    self.vm.$mount('#default-app');
    self.store = new LanternStore(self.vm.$data);
    self.store.setup(["r"]);
    return self;
}());