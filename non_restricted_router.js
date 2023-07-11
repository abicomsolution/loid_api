var express = require('express');
var controller = require('./controller');

var nonRestrictedRoutes = express.Router();

nonRestrictedRoutes.post('/save/token', function (req, res) {
    controller.saveToken(req.body, res);
});

nonRestrictedRoutes.get('/get-token/:id', function (req, res) {
    controller.getTokenByEmail(req.params.id, res);
});

nonRestrictedRoutes.post('/account/create', function (req, res) {
    controller.createAccount(req.body, res);
});

nonRestrictedRoutes.post('/account/auth', function (req, res) {
    controller.login(req.body, res);
});

nonRestrictedRoutes.post('/alert/list', function (req, res) {
    controller.getAlerts(req.body, res);
});

nonRestrictedRoutes.post('/fbtoken/save', function (req, res) {
    controller.saveFirebaseDeviceToken(req.body, res);
});

nonRestrictedRoutes.post('/fbtoken/delete', function (req, res) {
    controller.deleteFirebaseDeviceToken(req.body, res);
});

nonRestrictedRoutes.post('/alert/save', function (req, res) {
    controller.saveAlert(req.body, res);
});

nonRestrictedRoutes.get('/test/alert/save', function (req, res) {
    controller.testSaveAlert(res);
});

module.exports = nonRestrictedRoutes