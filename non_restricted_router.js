var express = require('express');
var controller = require('./controller');


var nonRestrictedRoutes = express.Router();

nonRestrictedRoutes.post('/save/token', function (req, res) {
    controller.saveToken(req.body, res);
});

nonRestrictedRoutes.get('/get-token/:id', function (req, res) {
    controller.getTokenByEmail(req.params.id, res);
});

module.exports = nonRestrictedRoutes