var mongoose = require("mongoose")
const Schema = mongoose.Schema

const loidUserSchema = new Schema({
    email: { type: "String" },
    password: { type: "String" },
    token: { type: "String" }
})

module.exports = mongoose.model('loid_user', loidUserSchema);