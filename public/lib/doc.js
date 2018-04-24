window.LanternDocument = (function(id,stor) {

    // used to preserve keyspace when storing and sending low-bandwidth
    var REG = {
        owner: 0x01,
        editor: 0x02,
        created_at: 0x03,
        updated_at: 0x04,
        parent_doc: 0x05,
        child_doc: 0x06,
        name: 0x10,
        category: 0x20, 
        count: 0x30,
        status: 0x40,
        point0: 0x60,
        point1: 0x61,
        point2: 0x62,
        point3: 0x63,
        point4: 0x64,
        point5: 0x65,
        point6: 0x66,
        point7: 0x67,
        point8: 0x68,
        point9: 0x69,
        watch: 0x80,
        style: 0x90
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

    self.has = function(k,s) {

        var key = (REG[k] ? REG[k] : k);

        var val = self.data[key]; 

        // easy access for nested keys one level down
        if (s) {
            return val.hasOwnProperty(s);
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

    self.save = function() {
        return stor.upsert(self.id, function(doc) {
            
            for (var idx in self.data) {
                doc[idx] = self.data[idx];
            }

            if (!doc[REG.created_at]) {
                doc[REG.created_at] = new Date();
            }
            else {
                doc[REG.updated_at] = new Date();
            }
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