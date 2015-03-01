var Question = require('../models/question');
var Answer = require('../models/answer');
var textUtils = require('../utils/textutils');
var tokenUtils = require('../utils/tokenutils');
var Constants = require('../constants');

module.exports = function () {
    return setupFunctions();
};

var setupFunctions = function () {
    var exports = {};

    exports.postAnswer = function (req, res) {
        var questionId = req.body.questionId;
        if (textUtils.isEmpty(questionId)) {
            res.status(400).json({error: Constants.ERROR.MISSING.QUESTION_ID});
            console.log("no questionId");
            return;
        }

        var text = req.body.answerBody;
        if (textUtils.isEmpty(text)) {
            res.status(400).json({error: Constants.ERROR.MISSING.ANSWER_BODY});
            console.log("no text");
            return;
        }

        var token = req.body.token;
        if (textUtils.isEmpty(token)) {
            res.status(400).json({error: Constants.ERROR.MISSING.TOKEN});
            return;
        }

        tokenUtils.getUserFromToken(token, function (err, doc) { //FIXME there's currently a link between question->answer and answer->question, make it one way
            if (err || !doc) {
                res.status(401).json({error: Constants.ERROR.INVALID.TOKEN});
            } else {
                var ans = new Answer({answerer: doc._id, question: questionId, answererName: doc.firstName, text: text});
                ans.save(function (err, answerSaved) {
                    if (err) {
                        res.status(500).json({error: Constants.ERROR.SAVE.ANSWER});
                    } else {
                        Question.findByIdAndUpdate(questionId, {$push: {answers: answerSaved._id}, $inc: {numAnswers: 1}}, function (err, question) {
                            if (err) {//TODO turn this into a findbyid, and then update on the docs
                                res.status(500).json({error: Constants.ERROR.SAVE.ANSWER});
                            } else {
                                res.json({result: Constants.SUCCESS.SAVE.ANSWER, questionId: question._id, answerId: answerSaved._id});
                            }
                        });
                    }
                });
            }
        });
    };    

    return exports;
};