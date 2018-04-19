window.LanternControl= (function(id, vue_opts, preload) {

    var self = {
        user: null
    };

    console.log("[ctl] -------------------------------------- " + id);


    //------------------------------------------------------------------------

    function registerUser() {
        var doc = {
            _id: getUserId(),
            name: "",
            role:  "guest",
            watch: {},
            created_at: new Date()
        };
        return self.stor.db.put(doc).then(function(result) {
            return doc;
        });
    }
    
    function getUserId() {
        var uid = window.localStorage.getItem("lantern-profile");
        if (!uid) {
            uid = Math.round(Math.random()*1000000);
            window.localStorage.setItem("lantern-profile", uid);
        }
        return uid;
    }

    function getUser() {
        return self.stor.db.get("u:"+getUserId());
    }

    function getOrRegisterUser() {
        return getUser()
            .catch(function(result) {
                return registerUser();
            });
    }

    //------------------------------------------------------------------------

    self.log = function() {
        var str = "["+id+"]";
        var args = Array.prototype.slice.call(arguments);
        for (var idx in args) {
            if (typeof(args[idx]) == "string") {
                str += " " + args[idx];
                args.splice(0,1);
            }
        }
        if (args.length) {
            console.log(str +":");
            for (var idy in args) {
                console.log(args[idy]);
            }
        }
        else {
            console.log(str);
        }
    };

    self.toggleSubscribe = function(cat) {
        // save category state
        return self.stor.db.upsert(self.user._id, function(user_doc) {
            user_doc.updated_at = new Date();
            if (!user_doc.watch) user_doc.watch = {};
            user_doc.watch[cat] = (user_doc.watch[cat] === true ? false : true);
            self.user = user_doc;
            return user_doc;
        });
    };
    
    self.vm = new Vue(vue_opts);
    self.stor = new LanternStor(self.vm.$data);

    self.stor.setup(preload)
        .then(getOrRegisterUser)
        .then(function(user) {
            self.log("user is", user);
            self.user = user;
            self.vm.$mount('#' + id + '-app');
            self.log("target is " + 
                (self.stor.db.adapter == "http" ? "remote" : "local") + 
                " db");

        });

    return self;
  
});