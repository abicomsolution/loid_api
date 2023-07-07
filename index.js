var express = require('express');
var mongoose = require('mongoose')
var nonRestrictedRoutes = require('./non_restricted_router');
var app = express();

const http = require('http');
const server = http.createServer(app);

var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

const config = {
	mongoURL: process.env.MONGO_URL || 'mongodb://localhost:27017/loid',

}

mongoose.connect(config.mongoURL, { useNewUrlParser: true }, (error) => {
	if (error) {
		console.error('Please make sure Mongodb is installed and running!'); // eslint-disable-line no-console
		throw error;
	}
});


app.use(bodyParser.json({ extended: true, limit: "	" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" })); // for parsing application/x-www-form-urlencoded
app.use(methodOverride());
app.use(cookieParser());

app.get('/', (req, res) => {
	res.send('Loig API v1.0')
})

app.use('/api', nonRestrictedRoutes);

var portNum = 6010;
server.listen(portNum, function () {
	console.log('Started at port:', portNum);
});

