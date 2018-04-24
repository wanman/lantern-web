window.LanternDocument = (function(id,stor) {

    // used to preserve keyspace when storing and sending low-bandwidth
    var REG = {
        
        title: 0x01,        // title or name of object
        text: 0x02,         // text or label for object
        status: 0x03,       // level or quantity

        owner: 0x10,        // user array
        editor: 0x11,       // user array

        ts: 0x20,           // timestamp array
        geo: 0x21,          // geohash array

        tag: 0x30,          // category or other tags

        style: 0x40         // css styles
    };


    // so we can get back keys by value in REG
    function getKeyByValue( obj, value ) {
        for( var prop in obj ) {
            if( obj.hasOwnProperty( prop ) ) {
                 if( obj[ prop ] == value )
                     return prop;
            }
        }
    }

    function hex8(val) {
        val &= 0xFF;
        var hex = val.toString(16).toUpperCase();
        return ("00" + hex).slice(-2);
    }


    //------------------------------------------------------------------------
    
    var self = {
        data: {}
    };

    self.has = function(k,s) {

        var key = (REG[k] ? REG[k] : k);

        var val = self.data[key]; 


        // easy access for nested keys one level down
        if (s && val) {
            if (val instanceof Array) {
                return val.indexOf(s) != -1;
            }
            else {
                return val.hasOwnProperty(s);
            }
        }
        else {
            return self.data.hasOwnProperty(key);
        }
    };

    self.get = function(k,s) {

        var key = (REG[k] ? REG[k] : k);
        var val = self.data[key]; 

        // easy access for nested keys one level down
        if (s) {
            if (typeof(val) == "object" && val.hasOwnProperty(s)) {
                return val[s];
            }
            else {
                return;
            }
        }
        else {
            return val;
        }
    };

    self.set = function(k, s, val) {

        var key = (REG[k] ? REG[k] : k);

        // support one level of nested keys
        if (val === undefined) {
            val = s;
            self.data[key] = val;
        }
        else {
            self.data[key] = self.data[key] || {};
            self.data[key][s] = val;
        }
    };

    self.push = function(k,val) {
        var key = (REG[k] ? REG[k] : k);
        self.data[key] = self.data[key] || [];
        self.data[key].push(val);
    };

    self.pop = function(k,val) {

        var key = (REG[k] ? REG[k] : k);

        if (val === undefined) {
            delete self.data[key];
        }
        else {
            self.data[key] = self.data[key] || [];
            var index = self.data[key].indexOf(val);
            console.log(index);
            self.data[key].splice(index,1);
            console.log(self.data[key]);
        }
    };

    self.save = function() {
        return stor.upsert(self.id, function(doc) {
            for (var idx in self.data) {
                doc[idx] = self.data[idx];
            }
            doc[REG.ts] = doc[REG.ts] || [];
            doc[REG.ts].push(new Date());
            return doc;
        })
        .catch(function(err) {
            if(err.name === "conflict") {
                console.log("[doc] conflicted: " + doc._id, err);
            }
            else {
                console.log("[doc] err", err);
            }

        });
    };


    self.remove = function() {
        return stor.remove(self.id);
    };

    /**
    * Constructs JSON object preserving key register
    */
    self.toJSON = function() {
        var new_doc = {};
        for (var idx in self.data) {
            new_doc[idx] = self.data[idx];
        }
        return new_doc;
    };

    /**
    * Constructs JSON but converts keys into human-readable format by register
    */
    self.toJSONFriendly = function() {
        var new_doc = {};
        for (var idx in self.data) {
            var key = getKeyByValue(REG, idx);
            if (key) {
                new_doc[key] = self.data[idx];
            }
            else {
                new_doc[idx] = self.data[idx];
            }
        }
        return new_doc;
    };


    //------------------------------------------------------------------------

    if (!id) {
         throw new Error("LanternDocument missing required ID");
    }


    if (typeof(id) == "object") {
        var doc = id;   
        self.id = doc._id;
        for (var idx in doc) {
            self.set(idx, doc[idx]);
        }
    }
    else {
        self.id = id;
    }

    

    return self;
});