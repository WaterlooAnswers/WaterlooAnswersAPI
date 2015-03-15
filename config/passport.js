var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');
var Constants = require('../constants');

// expose this function to our app using module.exports
module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, input, password, done) { //TODO use post data, not url params for info
            var email = input.toLowerCase();
            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function () {
                console.log("signing up with email " + email + " and password " + password);

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({ 'email': email }, function (err, user) {
                    console.log("db query done");
                    // if there are any errors, return the error
                    if (err) {
                        return done(err);
                    }
                    // check to see if theres already a user with that email
                    if (user) {
                        console.log("user already exists");
                        return done(Constants.ERROR.EMAIL_IN_USE, false);
                    } else if (!req.query.firstName || req.query.firstName === "") {
                        console.log("no first name");
                        return done(null, false);
                    } else {
                        console.log("lets create the user");
                        // if there is no user with that email
                        // create the user
                        var newUser = new User();

                        // set the user's local credentials
                        newUser.email = email;
                        newUser.password = newUser.generateHash(password);
                        newUser.firstName = req.query.firstName;
                        newUser.dateCreated = Date.now();
                        // save the user
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));

    passport.use('local-login', new LocalStrategy({
                // by default, local strategy uses username and password, we will override with email
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true // allows us to pass back the entire request to the callback
            },
            function (req, email, password, done) { // callback with email and password from our form
                email = email.toLowerCase();
                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({ 'email': email }, function (err, user) {
                    // if there are any errors, return the error before anything else
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, req.flash('loginMessage', 'Oops! User not found.')); // req.flash is the way to set flashdata using connect-flash

                    // if the user is found but the password is wrong
                    if (!user.validPassword(password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                    // all is well, return successful user
                    return done(null, user);
                });
            })
    );
};