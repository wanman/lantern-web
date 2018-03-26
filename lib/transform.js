window.LanternTransform = (function(doc) {
    var record = {};
    if (doc._id) {
        record.id = doc._id;
    }
    if (doc.ca) {
        record.created_at = doc.ca;
    }
    if (doc.es) {
        record.type = "place";
        record.name = [doc.es, "Elementary School"].join(" ");
    }
    else if (doc.ms) {
        record.type = "place";
        record.name = [doc.ms, "Middle School"].join(" ");
    }
    else if (doc.th) {
        record.type = "place";
        record.name = [doc.th, "Town Hall"].join(" ");
    }
    return record;
});