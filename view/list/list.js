window.list_view = (function() {

    var render = {};

    var self = {
        store: new LanternStore()
    };

    var opts = {
        methods: {},
        data: {
            rows: []
        },
        beforeMount: function() {
            console.log("[list] view initialized");

            self.store.db.allDocs({include_docs: true}).then(function(result) {
                for (var idx in result.rows) {
                    renderDoc(result.rows[idx].doc);
                }
            });

            self.store.sync()
                .on('change', function (info) {
                    if (info.change.docs) {
                        for (var idx in info.change.docs) {
                            renderDoc(info.change.docs[idx]);
                        }
                    }
                });

        }
    };

    var v = new Vue(opts);
    v.$mount('#list-app');

    function renderDoc(doc) {
        if (render[doc._id]) {
            if (doc._deleted) {
                v.$data.rows = v.$data.rows.filter(function(record) {
                    return record.id != doc._id;
                });
                return console.log("removing doc from view");
            }
            else {
                return console.log("doc already rendered");
            }
        }
        var record = LanternTransform(doc);
        v.$data.rows.push(record);
        render[doc._id] = doc;
    }


    self.doc = function() {
        var doc = {
            es: 'Meadowlane ' + Math.round(Math.random()*100),
            ca: new Date()
        };
        return self.store.db.post(doc).then(function (response) {
            console.log("[list] new doc saved");
            console.log(response);
            doc._id = response.id;
            doc._rev = response.rev;
            renderDoc(doc);
        }).catch(function (err) {
            console.log(err);
        });
    };

    return self;
    
}());