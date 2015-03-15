/**
 * Created by Sahil Jain on 20/08/2014.
 */
var Question = require('../models/question');
var _ = require('lodash');
var tokenUtils = require('../utils/tokenutils');
var Constants = require('../constants');

module.exports = function () {
    return setupFunctions();
};

var setupFunctions = function () {
    var exports = {};

    exports.getQuestionSet = function (req, res) { //TODO test if you pass words instead of numbers in params
        var questionsPerPage = req.query.questionsPerPage || 20;
        var pageNumber = req.query.pageNumber || 1;
        var sortOrder = req.query.sortOrder;
        var categoryId = req.query.categoryId;
        var query = {};
        if (categoryId) {
            query.category = global.questionCategories[categoryId];
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
        if (_.isEmpty(id)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.QUESTION_ID});
        }
        Question.findById(id).populate('answers').populate('asker').exec(function (err, item) {
            if (err) {
                return res.status(400).json({error: Constants.ERROR.QUESTION_BY_ID});
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
        if (_.isEmpty(id)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.QUESTION_ID});
        }
        if (_.isEmpty(token)) {
            return res.status(400).json({error: Constants.ERROR.MISSING.TOKEN});
        }
        tokenUtils.getUserFromToken(token, function (err, user) {
            if (!user) {
                return res.status(401).json({error: Constants.ERROR.INVALID.TOKEN});
            } else {
                Question.remove({_id: id, asker: user._id}, function (err, doc) {
                    if (err) {
                        res.status(400).json({error: Constants.ERROR.QUESTION_BY_ID});
                    } else {
                        res.status(204).send();
                    }
                })
            }
        });
    };

    exports.postQuestion = function (req, res) {
        var questionTitle = req.body.questionTitle;
        if (_.isEmpty(questionTitle)) {
            res.status(400).json({error: Constants.ERROR.MISSING.QUESTION_TITLE});
            return;
        }

        var text = req.body.questionDescription;
        if (_.isEmpty(text)) {
            res.status(400).json({error: Constants.ERROR.MISSING.QUESTION_DESCRIPTION});
            return;
        }

        var category = global.questionCategories[req.body.categoryIndex];
        if (_.isEmpty(category)) {
            res.status(400).json({error: Constants.ERROR.MISSING.QUESTION_CATEGORY});
            return;
        }

        var token = req.body.token;
        if (_.isEmpty(token)) {
            res.status(400).json({error: Constants.ERROR.MISSING.TOKEN});
            return;
        }
        tokenUtils.getUserFromToken(token, function (err, user) {
            if (err || !user) {
                return res.status(401).json({error: Constants.ERROR.INVALID.TOKEN});
            }
            var q1 = new Question({name: questionTitle, text: text, asker: user._id, category: category});
            q1.save(function (err, q1) {
                if (err) {
                    res.status(500).json({error: Constants.ERROR.SAVE.QUESTION});
                } else {
                    res.json({result: Constants.SUCCESS.SAVE.QUESTION, questionId: q1._id});
                }
            });
        });
    };

    return exports;
};