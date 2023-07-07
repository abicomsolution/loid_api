var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tokenSchema = new Schema({    
    email: { type: 'String' },
    token: { type: 'String' },
}, { toJSON: { virtuals: true } });

module.exports = mongoose.model('token', tokenSchema);