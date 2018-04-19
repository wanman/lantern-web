window.LanternPage= (function(id, vue_opts, preload) {

    var self = {};

    console.log("[page] -------------------------------------- " + id);
    
    vue_opts.data = vue_opts.data || {};
    vue_opts.data.user = null;
    for (var idx in preload) {
        vue_opts.data[preload[idx] +"_docs"] = [];
    }



    function registerUser() {
        console.log("[user] registering new user");
        var doc = {
            _id: "u:"+self.getUserId(),
            name: "",
            role:  "guest",
            watch: {},
            created_at: new Date()
        };
        return self.stor.put(doc)
            .then(function(result) {
                self.vm.$data.user = doc;
                return doc;
            })
            .catch(function(err) {
                if(err.name === "conflict") {
                    console.log("[user] conflicted user doc: " + doc._id, err);
                }
                else {
                    console.log("[user] unable to register user", err);
                }

            });
    }
    
  

    function getUser() {
        return self.stor.get("u:"+self.getUserId()).then(function(doc) {
            console.log("[page] existing user:", doc._id);
            self.vm.$data.user = doc;
            return doc;
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
        .then(function(doc) {
            self.vm.$mount('#' + id + '-app');
        });

    return self;
  
});