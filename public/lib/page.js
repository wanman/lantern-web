window.LanternPage= (function(id, vue_opts, preload) {

    var self = {
        user: null
    };

    console.log("[page] -------------------------------------- " + id);
    

    function registerUser() {
        console.log("[user] registering new user");
        var doc = new LanternDocument("u:"+self.getUserId(), self.stor);
        doc.save();
        return doc;
    }

    function getUser() {
        return self.stor.get("u:"+self.getUserId()).then(function(doc) {
            console.log("[page] existing user:", doc._id);
            self.vm.$data.user = doc;
            return new LanternDocument(doc, self.stor);
        });
    }

    //------------------------------------------------------------------------

    self.getUserId = function() {
        var uid = window.localStorage.getItem("lantern-profile");
        if (!uid) {
            uid = Math.round(Math.random()*1000000);
            window.localStorage.setItem("lantern-profile", uid);
        }
        return uid;
    };
         
    self.getOrCreateUser = function(){
        return getUser()
            .catch(function(result) {
                return registerUser();
            });
    };

    self.vm = new Vue(vue_opts);
    self.stor = new LanternStor(self.vm.$data);

    self.stor.setup(preload)
        .then(self.getOrCreateUser)
        .then(function(user) {
            self.user = user;
            var cached = self.stor.getCached(user.id);
            self.vm.$data.user = cached;
            self.vm.$mount('#' + id + '-app');
        });

    return self;
  
});