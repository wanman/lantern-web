window.LanternControl= (function(id, vue_opts, preload) {

    var self = {};

    console.log("[ctl] -------------------------------------- " + id);


    function registerUser() {
        console.log("[ctl] registering user");
        var my_user_id = self.stor.getUserId();

        console.log("[ctl] user is " +my_user_id);
        return self.stor.upsert("u:" + my_user_id, function(doc) {
            doc.name = "Anonymous";
            doc.role = "guest";
            if (!doc.watch) {
                doc.watch = {};
            }
            if (!doc.created_at) {
                doc.created_at = new Date();
            }
            else {
                doc.updated_at = new Date();
            }
            self.profile = doc;
            return doc;
        });
    }



    self.log = function(msg) {
        return console.log("["+id+"] " + msg);
    };
    
    self.vm = new Vue(vue_opts);
    self.stor = new LanternStor(self.vm.$data);

    self.stor.setup(preload)
        .then(registerUser)
        .then(function() {
            self.vm.$mount('#' + id + '-app');
            console.log("[ctl] target is " + 
                (self.stor.target_db.adapter == "http" ? "remote" : "local") + 
                " db");

        });

    return self;
  
});