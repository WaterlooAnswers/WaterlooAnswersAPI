/**
 * Created by Sahil Jain on 20/08/2014.
 */
var Question = require('../models/question');
var Answer = require('../models/answer');
var _ = require('lodash');
var tokenUtils = require('../utils/tokenutils');
var Constants = require('../constants');
var async = require('async');

var serverError = function (res) {
    return res.status(500).json({error: "server error"});
};

module.exports = function (passport) {
    var getUser = function (req, res) {
        var token = req.query.token;
        if (_.isEmpty(token)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.TOKEN});
        }

        tokenUtils.getUserFromToken(token, function (err, user) {
            if (err || !user) return res.status(401).json({error: Constants.ERROR.INVALID.TOKEN});
            var out = {};
            out.userId = user._id;
            out.firstName = user.firstName;
            out.email = user.email;
            out.dateJoined = user.dateCreated;
            Question.find({'asker': user._id}, function (err, questionsAsked) {
                if (err) {
                    return serverError(res);
                } else {
                    out.questionsAsked = Question.formatQuestionsList(questionsAsked);
                    Answer.find({'answerer': user._id}, function (err, answersGiven) {
                        if (err) {
                            return serverError(res);
                        } else {
                            out.answersGiven = [];
                            if (answersGiven.length == 0) {
                                return res.json(out);
                            } else {
                                async.forEach(answersGiven, function (answer, done) {
                                    Answer.format(answer, function (err, answerFormatted) {
                                        if (err || !answerFormatted) {
                                            return serverError(res);
                                        } else {
                                            out.answersGiven.push(answerFormatted);
                                            done();
                                        }
                                    });
                                }, function(err) {
                                    if (err) return serverError(res);
                                    return res.json(out);
                                });
                            }
                        }
                    });
                }
            });
        });
    };

    var getUserById = function (req, res) {
        var token = req.query.token;
        if (textUtils.isEmpty(token)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.TOKEN});
        }
        tokenUtils.getUserFromToken(token, function (err, tokenuser) { //only users with an access token can get profiles of other users (for safety reasons)
            if (!tokenuser) return res.status(401).json({error: Constants.ERROR.INVALID.TOKEN});
            User.findById(req.params.id, function (err, user) {
                if (err) return serverError(res);
                Question.find({'asker': user._id}, function (err, questionsAsked) {
                    if (err) return serverError(res);
                    Answer.find({'answerer': user._id}, function (err, answersGiven) {
                        if (err) return serverError(res);
                        out.answersGiven = [];
                        var numDeleted = 0;
                        if (answersGiven.length == 0) {
                            return res.json(out);
                        } else {
                            answersGiven.forEach(function (answer) {
                                var curAns = {};
                                Question.findOne({answers: answer._id}, function (err, questionAnswered) {
                                    if (err) return serverError(res);
                                    if (!questionAnswered) {
                                        console.log("deleted answer " + answer._id);
                                        answer.remove();
                                        numDeleted++;
                                    } else {
                                        curAns.questionId = questionAnswered._id;
                                        curAns.questionName = questionAnswered.name;
                                        curAns.questionDescription = questionAnswered.text;
                                        curAns.answerId = answer._id;
                                        curAns.answerText = answer.text;
                                        curAns.answerTime = answer.time;
                                        out.answersGiven.push(curAns); //TODO more information?
                                    }
                                    if ((out.answersGiven.length + numDeleted) == answersGiven.length) {
                                        return res.json(out);
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });
    };

    var getLoginToken = function (req, res, next) {
        if (_.isEmpty(req.query.email)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.EMAIL});
        }
        if (_.isEmpty(req.query.password)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.PASSWORD});
        }
        passport.authenticate('local-login', {session: false}, function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({error: Constants.ERROR.INVALID.EMAIL_OR_PASSWORD});
            }
            var token = tokenUtils.generateTokenFromUser(user);
            res.json({token: token});
        })(req, res, next);
    };

    var postSignup = function (req, res, next) {
        if (_.isEmpty(req.query.email)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.EMAIL});
        }
        if (_.isEmpty(req.query.password)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.PASSWORD});
        }
        if (_.isEmpty(req.query.firstName)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.FIRST_NAME});
        }
        passport.authenticate('local-signup', {session: false}, function (err, user, info) {
            if (err) {
                return res.status(401).json({error: err});
            }
            if (!user) {
                return res.status(401).json({error: Constants.ERROR.SAVE.USER});
            }
            var token = tokenUtils.generateTokenFromUser(user);
            res.json({success: true, username: user.email, firstName: user.firstName, token: token});
        })(req, res, next);
    };

    return {
        getUser: getUser,
        getUserById: getUserById,
        getLoginToken: getLoginToken,
        postSignup: postSignup
    };
};
