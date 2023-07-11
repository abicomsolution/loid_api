
var mongoose = require("mongoose")
const Schema = mongoose.Schema;

const alertsSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "loid_user", default: null },
    date_time: { type: Date, default: null },
    description: { type: "String", default: "" },
    photo_path: { type: "String", default: null },
    viewed: { type: Boolean, default: false }
});

module.exports = mongoose.model('alert', alertsSchema);