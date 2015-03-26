var User = require('../models/user');
var Question = require('../models/question');
var Answer = require('../models/answer');
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

exports.createQuestion = function (questionTitle, text, askerId, categoryIndex, done) {
    var q1 = new Question({
        name: questionTitle,
        text: text,
        asker: askerId,
        category: global.questionCategories[categoryIndex]
    });
    q1.save(function (err, question) {
        if (err) {
            console.log(err);
            throw err;
        } else {
            done(question);
        }
    });
};

exports.createAnswer = function (question, answerer, text, done) {
    var ans = new Answer({answerer: answerer._id, text: text});
    ans.save(function (err, answer) {
        if (err) {
            console.log(err);
            throw err;
        } else {
            question.answers.push(answer._id);
            question.save();
            done(answer);
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

exports.clearAnswerCollection = function (done) {
    mongoose.connection.collections.answers.remove(function () {
        return done();
    });
};