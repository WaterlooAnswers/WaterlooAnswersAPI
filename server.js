#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var message = false;
var Question = require('./models/question');
var Answer = require('./models/answer');


/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
          self.connection_string = 'mongodb://admin:hUQubExw-mK_@127.10.3.2:27017/sj';
        }else{
          self.connection_string = "mongodb://localhost/mfnadb";
        }
        

        // default to a 'localhost' configuration:
        //self.connection_string = '127.0.0.1:27017/sj';
        // if OPENSHIFT env variables are present, use the available connection info:
        //if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
          //self.connection_string = "mongodb://" + "admin" + ":" +
          //"hUQubExw-mK_" + "@" +
         // process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
          //process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
         // "sj";
        //}

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


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


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/'] = function(req, res) {
          if(req.isAuthenticated()){
            res.render('index.ejs', {user: req.user});
          }else{
            res.render('login', {message: req.flash('loginMessage')});
          }
        };

        self.routes['/ask'] = function(req, res) {
          res.render('addquestion');   
        };


        self.routes['/learn'] = function(req, res){
          Question.find({}, function(err, questions){
                message = questions;
          if(typeof(message) === typeof(false)){
            res.send("error!!");
          }else{
            res.render('listquestions', {questions: message});
          }
            });
        };
        self.routes['/answer'] = self.routes['/learn'];

        self.routes['/viewquestion'] = function(req, res){
          Question.findById(req.query.id).populate('answers').exec(function(err, q){
            res.render('viewquestion', {question: q});
          });
        };

        self.routes['/addanswer'] = function(req, res){
          Question.findById(req.query.id).populate('answers').exec(function(err, q){
            res.render('addanswer', {question: q});
          });
        };

        self.routes['/signup'] = function(req, res){
          res.render('signup.ejs', {message: req.flash('signupMessage')});
        };

    };

    function isLoggedIn(req, res, next){
      if(req.isAuthenticated()){
        return next();
      }
      res.redirect('/');
    };



    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        self.app.use(express.urlencoded());
        self.app.use(express.logger('dev'));
        self.app.use(express.cookieParser());

        self.app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
        self.app.use(passport.initialize());
        self.app.use(passport.session()); // persistent login sessions
        self.app.use(flash()); // use connect-flash for flash messages stored in session


        self.app.set('view engine', 'ejs');
        self.app.use(express.static(__dirname + '/public'));

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }


        self.app.get('/home', isLoggedIn, function(req, res){
          res.render('index.ejs', {user: req.user});
        });

        self.app.get('/logout', function(req,res){
          req.logout();
          res.redirect('/');
        });

        self.app.get('/profile', isLoggedIn, function(req, res){
          Question.find({'asker': req.user._id}, function(err, docs){
            res.render('profile', {user: req.user, questions: docs});
          });
          
        });

        self.app.post('/signup', passport.authenticate('local-signup', {
          successRedirect : '/home', // redirect to the secure profile section
          failureRedirect : '/signup', // redirect back to the signup page if there is an error
          failureFlash : true // allow flash messages
        }));

        self.app.post('/', passport.authenticate('local-login', {
          successRedirect : '/home', // redirect to the secure profile section
          failureRedirect : '/', // redirect back to the signup page if there is an error
          failureFlash : true // allow flash messages
        }));
  

        self.app.post('/ask', function(req,res){
            var name = req.body.name.toString();
            var text = req.body.text.toString();
            var asker = req.user._id;
            var q1 = new Question({name: name, text: text, asker: asker});
            q1.save(function(err, q1){
              if (err) {
                res.send("could not save question");
              };
              res.location('/viewquestion');
              res.redirect('/viewquestion?id=' + q1._id); 
            });
        });

        self.app.post('/addanswer', function(req,res){
            var text = req.body.text.toString();
            var ans = new Answer({text: text});
            var qid = req.body.questionid;
            ans.save(function(err, ans1){
              Question.findByIdAndUpdate(qid, {$push: {answers: ans._id}}, function(err, question){
               if(err)console.log("could not update answer");
               console.log(question.answers.toString());
              res.location('/viewquestion');
              res.redirect('/viewquestion?id=' + qid.toString());
              });
            });


        });        




       /* var q1 = new Question({name: "help with physics!"});
        q1.save(function(err, q1){
            if (err) return console.error(err);
        });*/
        mongoose.connect(self.connection_string);
        require('./config/passport')(passport);
        var db = mongoose.connection;
        db.on('error', function(){
            message = "error, the connection string is " + self.connection_string;
            console.log("database could not open");
        });
        db.once('open', function callback () {
            console.log("database open");
        });

    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

