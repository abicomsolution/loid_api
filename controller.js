var Token = require('./models/token')
var LoidUser = require("./models/loid_user")
var MasterPwd = require("./models/masterpwd")
var Alert = require("./models/alert.js")
var FbNotificationSubscription = require("./models/fb_notification_subscription")
var _  = require("lodash")
const argon2 = require("argon2")
const jwt = require('jsonwebtoken');
const firebaseAdmin = require('firebase-admin');
const moment = require("moment")

// const serviceAccount = require('./firebaseCredentials.json');
const serviceAccount = require('./firebaseCredentialsDev.json');

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount)
});

function Controller() {

    function hashString(str, cb) {
        argon2.hash(str).then((hash) => {
            cb(false, hash)
        })
            .catch((error) => {
                console.log(error)
                cb(error, "")
            })
    }

    function verifyHash(hash, str, cb) {
        argon2.verify(hash, str)
            .then((value) => {
                cb(false, value)
            })
            .catch((error) => {
                cb(error, "")
            })
    }


    this.saveToken = function (body, res) {
        console.log(body)
        Token.findOne({ email: body.email }).lean()
            .exec((err, result) => {
                if (err) {
                    res.json({ status: 0, data: "Failed" })
                } else {
                    if (result) {
                        Token.findByIdAndUpdate(result._id, { token: body.token })
                            .exec((err, result) => {
                                res.json({ status: 1, data: "Success" })
                            })
                    } else {
                        var newToken = new Token(body)
                        newToken.save((err) => {
                            if (err) {
                                console.log(err)
                            }
                            res.json({ status: 1, data: "Success" })
                        })
                    }
                }
            })
    }

    this.getTokenByEmail = function (email, res) {
        console.log(email)
        Token.findOne({ email: email }).lean()
            .exec((err, result) => {
                if (err) {
                    res.json({ status: 0, data: "Failed" })
                } else {
                    if (result) {
                        res.json({ status: 1, token: result.token })
                    } else {
                        res.json({ status: 0, data: "Token not found." })
                    }
                }
            })
    }

    this.createAccount = function (body, res) {

        const checkExistingUser = function () {
            return new Promise(function (resolve, reject) {
                let xp = new RegExp("^" + body.email + "$", "i")
                LoidUser.findOne({ email: xp }).exec((err, result) => {
                    if (result) {
                        reject({ name: "Email already been used." })
                    } else {
                        resolve()
                    }
                })
            })
        }

        const saveNewUser = function () {
            return new Promise(function (resolve, reject) {
                hashString(body.password, (err, hashedPwd) => {
                    if (hashedPwd) {
                        let obj = {
                            email: body.email,
                            password: hashedPwd,
                            token: ""
                        }

                        const newLoidUser = new LoidUser(obj)
                        newLoidUser.save((err, result) => {
                            resolve()
                        })
                    } else {
                        reject(err)
                    }
                })
            })
        }

        checkExistingUser()
            .then(saveNewUser)
            .then(() => {
                res.json({ status: 1 })
            })
            .catch((error) => {
                console.log(error)
                res.json({ status: 0, message: error.name })
            })
    }

    this.login = function (body, res) {

        var member = null
        var isMasterPassword = false

        const checkEmail = function () {
            return new Promise(function (resolve, reject) {
                let xp = new RegExp(body.email, "i")
                LoidUser.findOne({ email: xp }, "-plainpwd").lean().exec((err, result) => {
                    if (result) {
                        member = result
                        resolve()
                    } else {
                        reject({ name: "Invalid email address/password" })
                    }
                })
            })
        }

        const checkMasterPassword = function () {
            return new Promise(function (resolve, reject) {
                MasterPwd.findOne({ status: 0 }).exec((err, result) => {
                    if (result) {
                        verifyHash(result.password, body.password, (err1, isMatch) => {
                            if (isMatch) {
                                isMasterPassword = true
                            }

                            resolve()
                        })
                    } else {
                        resolve()
                    }
                });
            })
        }

        const checkPassword = function () {
            return new Promise(function (resolve, reject) {
                verifyHash(member.password, body.password, (err, isMatch) => {
                    if (isMasterPassword) {
                        resolve()
                    } else {
                        if (isMatch) {
                            resolve()
                        } else {
                            var _err = { name: "Invalid email address/password." };
                            reject(_err);
                        }
                    }
                })
            })
        }


        checkEmail()
            .then(checkMasterPassword)
            .then(checkPassword)
            .then(() => {
                const token = jwt.sign({ id: member._id, email: member.email, password: member.password }, 'LOID', { expiresIn: 432000 });
                let userdata = member
                delete userdata.password
                res.json({ status: 1, userdata: userdata, token: token })
            })
            .catch((error) => {
                console.log(error)
                res.json({ status: 0, message: error.name })
            })
    }

    this.getAlerts = function (body, res) {

        var alerts = []

        const getUserAlerts = function () {
            return new Promise(function (resolve, reject) {
                Alert.find({ user_id: body.id })
                    .lean()
                    .sort({ date_time: -1 })
                    .exec((err, result) => {
                        alerts = result
                        resolve()
                    })
            })
        }

        getUserAlerts()
            .then(() => {
                res.json({ status: 1, alerts: alerts })
            })
            .catch((error) => {
                res.json({ status: 0, message: error?.name })
            })
    }

    this.saveAlert = function (body, res) {

        var unViewedAlerts = 0

        const saveNewAlert = function () {
            return new Promise(function (resolve, reject) {
                let obj = {
                    user_id: body.user_id,
                    date_time: moment().toDate(),
                    description: body.description,
                    photo_path: body.photo_path
                }

                const newAlert = new Alert(obj)
                newAlert.save((err, result) => {
                    resolve()
                })
            })
        }

        const countUnViewedAlerts = function () {
            return new Promise(function (resolve, reject) {
                Alert.countDocuments({ user_id: body.user_id, viewed: false }).exec((err, result) => {
                    unViewedAlerts = result
                    resolve()
                })
            })
        }

        const sendFbNotif = function () {
            return new Promise(function (resolve, reject) {
                let firebaseNotifBody = {
                    member_id: body.user_id,
                    notification: {
                        title: `You have ${unViewedAlerts} Alerts`,
                        body: ""
                    }
                }
                sendFirebaseNotification(firebaseNotifBody, () => {
                    resolve()
                })
            })
        }

        saveNewAlert()
            .then(countUnViewedAlerts)
            .then(sendFbNotif)
            .then(() => {
                res.json({ status: 0 })
            })
            .catch((error) => {
                res.json({ status: 0, message: error?.name })
            })
    }

    this.testSaveAlert = function (res) {

        var body = {
            user_id: "64adfaa76f97ea311c326a6a",
            description: "Lock Picking",
            photo_path: "https://tieapp-assets.s3.ap-southeast-1.amazonaws.com/assets/793c637c-5854-4376-b684-2605600e6468.png"
        }

        var unViewedAlerts = 0

        const saveNewAlert = function () {
            return new Promise(function (resolve, reject) {
                let obj = {
                    user_id: body.user_id,
                    date_time: moment().toDate(),
                    description: body.description,
                    photo_path: body.photo_path
                }

                const newAlert = new Alert(obj)
                newAlert.save((err, result) => {
                    resolve()
                })
            })
        }

        const countUnViewedAlerts = function () {
            return new Promise(function (resolve, reject) {
                Alert.countDocuments({ user_id: body.user_id, viewed: false }).exec((err, result) => {
                    unViewedAlerts = result
                    resolve()
                })
            })
        }

        const sendFbNotif = function () {
            return new Promise(function (resolve, reject) {
                let firebaseNotifBody = {
                    member_id: body.user_id,
                    notification: {
                        title: `You have ${unViewedAlerts} Alerts`,
                        body: ""
                    }
                }
                sendFirebaseNotification(firebaseNotifBody, () => {
                    resolve()
                })
            })
        }

        saveNewAlert()
            .then(countUnViewedAlerts)
            .then(sendFbNotif)
            .then(() => {
                res.json({ status: 1 })
            })
            .catch((error) => {
                res.json({ status: 0 })
                console.log(error)
            })
    }

    const sendFirebaseNotification = function (body, callback) {

        // body = {
        //     member_id: null,
        //     notification: {
        //         title: "",
        //         body: ""
        //     }
        // }

        var subs = null

        const notificationSubs = function () {
            return new Promise(function (resolve, reject) {
                FbNotificationSubscription.findOne({ member_id: body.member_id }).lean().exec((err, result) => {
                    if (result) {
                        subs = result
                        console.log(subs)
                        resolve()
                    } else {
                        callback()
                    }
                })
            })
        }

        const sendNotificationToClient = function () {
            return new Promise(function (resolve, reject) {
                if (subs.token.length > 0) {
                    let topic = subs.member_id + "_Notification"
                    firebaseAdmin.messaging().subscribeToTopic(subs.token, topic).then((subscriptionResponse) => {
                        const message = {
                            data: {
                                channelId: subs.member_id + "_ch",
                                title: body.notification.title,
                                body: body.notification.body
                            },
                            topic: topic,
                        };


                        firebaseAdmin.messaging().send(message).then(sendResponse => {
                            firebaseAdmin.messaging().unsubscribeFromTopic(subs.token, topic)
                                .then((response) => {
                                    resolve()
                                })
                                .catch((error2) => {
                                    console.log("REJECT 1")
                                    reject(error2)
                                });
                        })
                            .catch(error1 => {
                                console.log("REJECT 2")
                                reject(error1)
                            });
                    })
                        .catch((error) => {
                            console.log("REJECT 3")
                            reject(error)
                        });
                } else {
                    callback()
                }
            })
        }

        notificationSubs()
            .then(sendNotificationToClient)
            .then(() => {
                callback()
            })
            .catch((error) => {
                console.log(error)
                callback()
            })
    }

    this.saveFirebaseDeviceToken = function (body, res) {

        const checkNotifSubsciption = function () {
            return new Promise(function (resolve, reject) {
                FbNotificationSubscription.findOne({ member_id: body.memberId }).exec((err, result) => {
                    if (result) {
                        let tokens = result.token
                        let tokenIndex = _.findIndex(tokens, function (e) { return e == body.token })
                        if (tokenIndex >= 0) {
                            resolve()
                        } else {
                            tokens.push(body.token)
                            FbNotificationSubscription.findByIdAndUpdate(result._id, { token: tokens }).exec((err2, result2) => {
                                resolve()
                            })
                        }
                    } else {
                        let obj = {
                            member_id: body.memberId,
                            token: [body.token]
                        }
                        let newFbNotificationSubscription = new FbNotificationSubscription(obj)
                        newFbNotificationSubscription.save((err1, result1) => {
                            resolve()
                        })
                    }
                })
            })
        }

        checkNotifSubsciption()
            .then(() => {
                res.json({ status: 1 })
            })
            .catch((error) => {
                console.log(error)
                res.json({ status: 0, message: error.name })
            })

    }

    this.deleteFirebaseDeviceToken = function (body, res) {

        const checkNotifSubsciption = function () {
            return new Promise(function (resolve, reject) {
                FbNotificationSubscription.findOne({ member_id: body.memberId }).exec((err, result) => {
                    if (result) {
                        let tokens = result.token
                        let tokenIndex = _.findIndex(tokens, function (e) { return e == body.token })
                        if (tokenIndex >= 0) {
                            tokens.splice(tokenIndex, 1)
                            FbNotificationSubscription.findByIdAndUpdate(result._id, { token: tokens }).exec((err2, result2) => {
                                resolve()
                            })
                        } else {
                            resolve()
                        }
                    } else {
                        resolve()
                    }
                })
            })
        }

        checkNotifSubsciption()
            .then(() => {
                res.json({ status: 1 })
            })
            .catch((error) => {
                console.log(error)
                res.json({ status: 0, message: error.name })
            })
    }
}

module.exports = new Controller()