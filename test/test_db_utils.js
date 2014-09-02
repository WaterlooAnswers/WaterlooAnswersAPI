var User = require('../models/user');
var Question = require('../models/question');
var mongoose = require('mongoose');

exports.createTestUser = function (email, password, firstName, done) {
    var newUser = new User();
    newUser.email = email;
    newUser.password = newUser.generateHash(password);
    newUser.firstName = firstName;
    newUser.dateCreated = Date.now();
    newUser.save(function (err) {
        if (err) {
            console.log("error creating user");
            throw err;
        }
        return done(newUser);
    });
};

exports.createTestQuestion = function (questionTitle, text, askerId, categoryIndex, done) {
    var q1 = new Question({name: questionTitle, text: text, asker: askerId, category: global.questionCategories[categoryIndex]});
    q1.save(function (err, question) {
        if (err) {
            throw err;
        } else {
            done(question);
        }
    });
};

exports.clearUserCollection = function (done) {
    mongoose.connection.collections.users.remove(function () {
        return done();
    });
};

exports.clearQuestionCollection = function (done) {
    mongoose.connection.collections.questions.remove(function () {
        return done();
    });
};