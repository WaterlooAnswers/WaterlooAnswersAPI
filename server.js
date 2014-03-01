#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var mongoose = require('mongoose');
var message = false;
var Question = false;
var Answer = false;


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

        Answer = mongoose.model('Answer', mongoose.Schema({
          text: String
        }));

        Question = mongoose.model('Question', mongoose.Schema({
          name: String,
          text: String,
          answers: [this.Answer]
        }));


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
         
          Question.find({}, function(err, questions){
                message = questions;
             
            });
          if(typeof(message) === typeof(false)){
            res.send("error!!");
          }else{
            res.render('index', {questions: message});
          }
        };

        self.routes['/addquestion'] = function(req, res) {
          res.render('addquestion');   
        };

        self.routes['/addanswer'] = function(req, res){
          Question.findById(req.query.id, function(err, q){
            console.log(q["name"]);
            res.render('addanswer', {question: q});
          });
          
        };

    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        self.app.use(express.urlencoded());
        self.app.set('view engine', 'ejs');

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

        mongoose.connect(self.connection_string);

        self.app.post('/addquestion', function(req,res){
            var name = req.body.name.toString();
            var text = req.body.text.toString();
            var q1 = new Question({name: name, text: text, answers: []});
            q1.save(function(err, q1){
              if (err) return console.error(err);
            });
            res.location('/');
            res.redirect('/');  
        });

        self.app.post('/addanswer', function(req,res){
            var text = req.body.text.toString();

            var qid = req.body.questionid;
            var a1 = new Answer({text: text});
            a1.save();
            Question.findById(qid, function(err, question){
              question.answers.push(a1);
              console.log(question.answers.toString());
            });
            res.location('/');
            res.redirect('/');
        });        




       /* var q1 = new Question({name: "help with physics!"});
        q1.save(function(err, q1){
            if (err) return console.error(err);
        });*/

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

