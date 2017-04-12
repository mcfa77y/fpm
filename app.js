var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors')
// var routes = require('./routes/index');
var users = require('./routes/users');
const rp = require('request-promise');
var app = express();
var routes = require('./routes/index');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
var corsOptions = {
  origin: 'http://localhost:3000/',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            err
        })
    })


const CREDENTIALS = require("r-json")(`credentials.json`);
function createJsonString(json) {
    let cache = [];
    return JSON.stringify(json, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Circular reference found, discard key
                return;
            }
            // Store value in our collection
            cache.push(value);
        }
        return value;
    }, 4);
}
const Logger = require("bug-killer");
function getErrorGif() {
    const options = {
        uri: 'http://api.giphy.com/v1/gifs/search',
        qs: {
            q: 'zoidberg',
            api_key: CREDENTIALS.giphy.api_key

        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };
    return rp(options)
        .then((json) => {
            const randomIndex = _.random(0, json.data.length);
            Logger.log("getting error gif: " + createJsonString(json.data[randomIndex]))
            return json.data[randomIndex].images.original.url;
        })
        .catch((err) => {
            Logger.log('Error getting gif: ' + err, 'error');
        });
}

module.exports = app;
