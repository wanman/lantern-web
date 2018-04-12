window.app = (function() {

    var render = {};

    var self = {};

    var vue_opts = {
        methods: {
            pluralize: function(count) {
                if (count === 0) {
                    return 'No Users';
                } 
                else if (count === 1) {
                    return '1 User';
                } else {
                    return count + ' Users';
                }
            }
        },
        data: {
            c_docs: [],
            u_docs: []
        },
        beforeMount: function() {
            console.log("[map] view initialized");
        }
    };

    self.vm = new Vue(vue_opts);

    self.store = new LanternStore(self.vm.$data);
    self.store.setup(["c", "u"]).then(function() {
        self.vm.$mount('#map-app');
    });

    return self;
    
}());