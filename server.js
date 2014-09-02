#!/bin/env node

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var flash = require('connect-flash');
var Question = require('./models/question');
var Answer = require('./models/answer');
var settings = require('./config/settings');

var SampleApp = function () {

    var self = this;

    self.terminator = function (sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating sample app ...',
                Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };

    self.setupTerminationHandlers = function () {
        //  Process on exit and signals.
        process.on('exit', function () {
            self.terminator();
        });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function (element, index, array) {
                process.on(element, function () {
                    self.terminator(element);
                });
            });
    };

    self.initializeServer = function () {
        self.app = express();
        self.app.use(bodyParser.urlencoded({extended: true}));
        self.app.use(bodyParser.json());
        self.app.use(morgan('combined'));
        var MongoStore = require('connect-mongo')(session);
        self.app.use(cookieParser());
        self.app.use(session({
            store: new MongoStore({url: settings.connection_string}),
            secret: 'ilovescotchscotchyscotchscotch',
            resave: true,
            saveUninitialized: true
        })); // session secret
        self.app.use(passport.initialize());
        self.app.use(passport.session()); // persistent login sessions
        self.app.use(flash()); // use connect-flash for flash messages stored in session
        self.app.set('view engine', 'ejs');
        self.app.use(express.static(__dirname + '/public'));
        self.app.disable("x-powered-by");
        require('./app/routes.js')(self, passport);
        require('./config/passport')(passport);
        require('./config/database')(settings.connection_string);
    };

    self.initialize = function () {
        self.setupTerminationHandlers();
        settings.init();
        self.initializeServer();
    };

    self.start = function () {
        self.app.listen(settings.port, settings.ipaddress, function () {
            console.log('%s: Node server started on %s:%d ...', Date(Date.now()), settings.ipaddress, settings.port);
        });
    };

};

var zapp = new SampleApp();
zapp.initialize();
zapp.start();
module.exports = zapp.app;

