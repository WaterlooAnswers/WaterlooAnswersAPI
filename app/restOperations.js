/**
 * Created by Sahil Jain on 20/08/2014.
 */
var Question = require('../models/question');
var Answer = require('../models/answer');
var User = require('../models/user');
var jwt = require('jwt-simple');
var textUtils = require('../utils/textutils');

var serverError = function (res) {
    console.log("sending error");
    return res.status(500).json({error: "server error"});
};

module.exports = function (passport) {
    return setupFunctions(passport);
};

var setupFunctions = function (passport) {
    var exports = {};

    exports.getCategories = function (req, res) {
        var output = [];
        for (var i = 0; i < global.questionCategories.length; i++) {
            output.push({categoryId: i, categoryName: global.questionCategories[i]});
        }
        res.json(output);
    };

    exports.getQuestionSet = function (req, res) { //TODO test if you pass words instead of numbers in params
        var questionsPerPage = req.query.questionsPerPage || 20;
        var pageNumber = req.query.pageNumber || 1;
        var sortOrder = req.query.sortOrder;
        console.log(sortOrder);
        var categoryId = req.query.categoryId;
        var query = {};
        if (categoryId) {
            query.category = global.questionCategories[categoryId];
            console.log(query);
        }

        var skip = questionsPerPage * (pageNumber - 1);
        if (skip < 0) skip = 0;

        var sortObject = {};
        if (sortOrder == 'mostFavourited') {
            sortObject.numFavourites = -1;
        } else if (sortOrder == 'mostViewed') {
            sortObject.numViews = -1;
        } else {
            sortObject.time = -1;
        }

        Question.find(query).sort(sortObject).skip(skip).limit(questionsPerPage).populate('asker', 'firstName _id').exec(function (err, questions) {
            var output = [];
            questions.forEach(function (item) {
                var currentOutput = {};
                currentOutput.questionId = item._id;
                currentOutput.name = item.name;
                currentOutput.description = item.text;
                currentOutput.askerName = item.asker.firstName;
                currentOutput.askerId = item.asker._id;
                currentOutput.category = item.category;
                currentOutput.numAnswers = item.answers.length;
                currentOutput.numVotes = item.votes;
                currentOutput.timeAsked = item.time;
                output.push(currentOutput);
            });
            res.json(output);
        });
    };

    exports.getQuestionById = function (req, res) {
        var id = req.params.id;
        Question.findById(id).populate('answers').populate('asker').exec(function (err, item) {
            if (err) {
                res.status(400).json({error: "Could not find question, please form your requests like the following: api/question/QUESTION_ID"});
            } else {
                var currentOutput = {};
                currentOutput.questionId = item._id;
                currentOutput.name = item.name;
                currentOutput.description = item.text;
                currentOutput.askerName = item.asker.firstName;
                currentOutput.askerId = item.asker._id;
                currentOutput.askerEmail = item.asker.email;
                currentOutput.category = item.category;
                currentOutput.numAnswers = item.answers.length;
                currentOutput.answers = [];
                item.answers.forEach(function (answer) {
                    var currentAnswer = {};
                    currentAnswer.answererId = answer.answerer._id;
                    currentAnswer.answererName = answer.answererName;
                    currentAnswer.text = answer.text;
                    currentAnswer.answerId = answer._id;
                    currentAnswer.timeAnswered = answer.time;
                    currentOutput.answers.push(currentAnswer);
                });
                currentOutput.favourites = item.favourites;
                currentOutput.numVotes = item.votes;
                currentOutput.timeAsked = item.time;
                res.json(currentOutput);
            }
        });
    };

    exports.deleteQuestionById = function (req, res) {
        var id = req.body.id;
        var token = req.body.token;
        if (!id) {
            return res.status(400).json({error: "please give a question id"});
        }
        if (!token) {
            return res.status(400).json({error: "please give a valid token"});
        }
        getUserFromToken(token, function (err, user) {
            if (!user) {
                return res.status(400).json({error: "Invalid token"});
            } else {
                Question.remove({_id: id, asker: user._id}, function (err, doc) {
                    if (err) {
                        res.status(400).json({error: "Could not find question, please form your requests according to the documentation"});
                    } else {
                        res.status(204).send();
                    }
                })
            }
        });
    };

    exports.postQuestion = function (req, res) {
        var questionTitle = req.body.questionTitle;
        if (textUtils.isEmpty(questionTitle)) {
            res.status(400).json({error: "please provide 'questionTitle' property"});
            return;
        }

        var text = req.body.questionDescription;
        if (textUtils.isEmpty(text)) {
            res.status(400).json({error: "please provide 'questionDescription' property"});
            return;
        }

        var category = global.questionCategories[req.body.categoryIndex];
        if (textUtils.isEmpty(category)) {
            res.status(400).json({error: "please provide valid 'categoryIndex' number"});
            return;
        }

        var token = req.body.token;
        if (textUtils.isEmpty(category)) {
            res.status(400).json({error: "please provide valid 'token'"});
            return;
        }

        getUserFromToken(token, function (err, user) {
            if (err || !user) {
                return res.status(401).json({error: "invalid token"});
            }

            var q1 = new Question({name: questionTitle, text: text, asker: user._id, category: category});
            q1.save(function (err, q1) {
                if (err) {
                    res.status(500).json({error: "could not save question"});
                } else {
                    res.json({result: "Successfully added question!", questionId: q1._id});
                }
            });
        });
    };


    exports.getUser = function (req, res) { //TODO format the output of questions/answers correctly
        var token = req.query.token;
        if (textUtils.isEmpty(token)) {
            return res.status(400).json({error: "please provide 'token' property"});
        }

        getUserFromToken(token, function (err, user) {
            if (!user) return res.status(400).json({error: "token invalid"});
            var out = {};
            out.userId = user._id;
            out.firstName = user.firstName;
            out.email = user.email;
            out.dateJoined = user.dateCreated;
            Question.find({'asker': user._id}, function (err, questionsAsked) {
                if (err) {
                    return serverError(res);
                } else {
                    out.questionsAsked = questionsAsked; //todo format question docs for output
                    Answer.find({'answerer': user._id}, function (err, answersGiven) {
                        if (err) {
                            return serverError(res);
                        } else {
                            console.log("someone asked for user");
                            out.answersGiven = [];
                            var numDeleted = 0;
                            if (answersGiven.length == 0) {
                                return res.json(out);
                            } else {
                                answersGiven.forEach(function (answer) {
                                    var curAns = {};
                                    Question.findOne({answers: answer._id}, function (err, questionAnswered) {
                                        if (err) {
                                            return serverError(res);
                                        } else if (!questionAnswered) {
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
                        }
                    });
                }
            });
        });
    };

    exports.postAnswer = function (req, res) {
        var token = req.body.token;
        if (textUtils.isEmpty(token)) {
            res.status(400).json({error: "please provide 'token' property"});
            return;
        }

        var questionId = req.body.questionId;
        if (textUtils.isEmpty(questionId)) {
            res.status(400).json({error: "please provide 'questionId' property"});
            console.log("no questionId");
            return;
        }

        var text = req.body.answerBody;
        if (textUtils.isEmpty(text)) {
            res.status(400).json({error: "please provide 'answerBody' property"});
            console.log("no text");
            return;
        }

        getUserFromToken(token, function (err, doc) { //FIXME there's currently a link between question->answer and answer->question, make it one way
            if (err || !doc) {
                res.status(401).json({error: "incorrect token"});
            } else {
                var ans = new Answer({answerer: doc._id, question: questionId, answererName: doc.firstName, text: text});
                ans.save(function (err, answerSaved) {
                    if (err) {
                        res.status(500).json({error: "could not save answer"});
                    } else {
                        Question.findByIdAndUpdate(questionId, {$push: {answers: answerSaved._id}, $inc: {numAnswers: 1}}, function (err, question) {
                            if (err) {//TODO turn this into a findbyid, and then update on the docs
                                res.status(500).json({error: "could not save answer"});
                            } else {
                                res.json({result: "Successfully added answer!", questionId: question._id, answerId: answerSaved._id});
                            }
                        });
                    }
                });
            }
        });
    };

    exports.getLoginToken = function (req, res, next) {
        passport.authenticate('local-login', {session: false}, function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({error: "invalid username or password"});
            }
            var token = generateTokenFromUser(user);
            console.log(token);
            res.json({token: token});
        })(req, res, next);
    };

    exports.postSignup = function (req, res, next) {
        passport.authenticate('local-signup', {session: false}, function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({error: "did not create user"});
            }
            var token = generateTokenFromUser(user);
            res.json({success: true, username: user.email, firstName: user.firstName, token: token});
        })(req, res, next);
    };

    return exports;
};

function generateTokenFromUser(user) {
    return jwt.encode({userId: user._id}, "mysecret");
}

function getUserFromToken(token, next) {
    var id;
    try {
        id = jwt.decode(token, "mysecret");
    } catch (ex) {
        return next(true, null);
    }
    User.findById(id.userId, function (err, doc) {
        next(err, doc);
    });
}