#!/bin/env node

var express = require('express');
var fs      = require('fs');
//var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var Question = require('./models/question');
var Answer = require('./models/answer');
var settings = require('./config/settings');


var SampleApp = function() {

    //  Scope.
    var self = this;

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.app = express();
        self.app.use(express.urlencoded());
        self.app.use(express.logger('dev'));
		var MongoStore = require('connect-mongo')(express);
        self.app.use(express.cookieParser());
        self.app.use(express.session({
        	store: new MongoStore({url: settings.connection_string}),
        	secret: 'ilovescotchscotchyscotchscotch' 
        })); // session secret
        self.app.use(passport.initialize());
        self.app.use(passport.session()); // persistent login sessions
        self.app.use(flash()); // use connect-flash for flash messages stored in session
        self.app.set('view engine', 'ejs');
        self.app.use(express.static(__dirname + '/public'));

        require('./app/routes.js')(self, passport);
        require('./config/passport')(passport);
        require('./config/database')(settings.connection_string);

    };

    self.initialize = function() {
        self.setupTerminationHandlers();
        settings.init();
        self.initializeServer();
    };

    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(settings.port, settings.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...', Date(Date.now() ), settings.ipaddress, settings.port);
        });

    };

};


var zapp = new SampleApp();
zapp.initialize();
zapp.start();

