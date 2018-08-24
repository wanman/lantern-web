LX.Document = (function(id,stor) {
 
    // used to preserve keyspace when storing and sending low-bandwidth
    var REG = {
        
        // private metadata won't relay over LoRa
        created_at: "$ca",   // creation date
        updated_at: "$ua",   // doc update date
        sent_at: "$sa",      // doc sent (with radio)
        imported_at: "$ia", // doc imported from disk, do not send over radio


        // radio-specific metadata
        received_at: "$ra",  // doc received at (from radio)
        version: "$rv", // passed across radio messages

        // public data for all sync and broadcast
        title: "tt",        // title or name of object
        slug: "sg",         // slug for object
        text: "tx",         // text or label for object
        icon: "ic",         // icon to describe object
        status: "st",       // level or quantity
        owner: "ou",        // user array
        editor: "eu",       // user array
        geo: "gp",          // geohash array
        radius: "rd",       // geographic radius
        category: "ct",     // category tag
        tag: "tg",          // other tags
        style: "sl",        // css styles,
        parent: "pt",       // parent document reference
        child: "cd",        // child document reference,

        // verification parameters / votes for accuracy
        vote: "vt", // @todo remove depracated vote dictionary
        vote_red_cross: "vr",
        vote_neighbors: "vn",
        vote_officials: "vo",
        vote_oxfam: "vx",
        vote_un: "vu",
        vote_fema: "vf"

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

    function post(doc) {
        return stor.post(doc)
            .then(function(results) { 
                console.log("[" + self.id + "] saved", results.rev);
                self.data._rev = results.rev;
                return doc;
            })
            .catch(function(err) {
                if(err.name === "conflict") {
                    console.log("["+self.id+"] conflicted", err);
                }
                else {
                    console.log("["+self.id+"] err", err);
                }
            }); 
    }

    function hasNewData(old_doc) {

        for (var k in self.data) {
            if (old_doc.data.hasOwnProperty(k)) {
                var old_val = JSON.stringify(old_doc.data[k]);
                // don't compare $ meta
                if (k[0] != "$" && self.has(k)) {
                    var new_val = JSON.stringify(self.data[k]);
                    if (old_val != new_val) {
                        console.log("[" + self.id + "] has new data:",  k, new_val)
                        return true;
                    }
                }   
            }
            else {
                return true;
            }
        }
        return false;
    }



    //------------------------------------------------------------------------
    
    var self = {
        id: null,
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
        if (!self.has(k, val)) {
            self.data[key].push(val);
        }
    };

    self.pop = function(k,val) {

        var key = (REG[k] ? REG[k] : k);

        if (val === undefined) {
            delete self.data[key];
        }
        else {
            self.data[key] = self.data[key] || [];
            var index = self.data[key].indexOf(val);
            self.data[key].splice(index,1);
        }
    };

    self.save = function(check_existing, skip_if_exists) {

        if (!self.has("created_at")) {
            self.set("created_at", new Date());
        }
        else {
            self.set("updated_at", new Date());
        }

        var doc = {
            _id: self.id
        };

        if (self.data._rev) {
            doc._rev = self.data._rev;
        }
        
        for (var idx in self.data) {
            if (idx != "$ra" && idx != "$rx" ) {
                doc[idx] = self.data[idx];
            }
        }


        if (check_existing) {
            // make sure we're not saving duplicate document
            return stor.get(self.id, true).then(function(old_doc) {
                
                if (!skip_if_exists && hasNewData(old_doc)) {
                    doc._rev = old_doc.get("_rev");
                    return post(doc);
                }
                else {
                    //console.log("[" + self.id + "] skipping save by request");
                    return;
                }
            })
            .catch(function(err) {
                console.log(err);
                return post(doc);
            });
        }
        else {
            return post(doc);
        }
    };


    self.remove = function() {
        return stor.remove(self.id, self.data._rev);
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
         throw new Error("LX.Document missing required ID");
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

    // random identifiers for new docs to avoid sync conflicts
    self.id = self.id.replace("%%", Math.round(Math.random() * 1000));

    if (!stor) {
        console.log("[" + self.id + "] missing required stor object");
    }

    return self;
});