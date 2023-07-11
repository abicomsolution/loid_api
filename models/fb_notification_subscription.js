
var mongoose = require("mongoose")
const Schema = mongoose.Schema;

const firebaseNotificationSubscriptionSchema = new Schema({
    member_id: { type: Schema.Types.ObjectId, ref: 'loid_user' },
    token: { type: Array, default: [] }
});

module.exports = mongoose.model('fb_notification_subscription', firebaseNotificationSubscriptionSchema);
