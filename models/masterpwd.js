
var mongoose = require("mongoose")
const Schema = mongoose.Schema;

const masterPwdSchema = new Schema({
    password: { type: "String", default: "" },
    status: { type: Number, default: 0 }
});

module.exports = mongoose.model('masterpwd', masterPwdSchema);