var mongoose = require('mongoose');
var _ = require('lodash');
var User = require('./user');

global.questionCategories = [
    'SE212', 'ECE222', 'CS241', 'STAT206', 'CHE102'
];

var questionSchema = mongoose.Schema({
    asker: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: String,
    favourites: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    text: String,
    time: {type: Date, default: Date.now},
    answers: [{type: mongoose.Schema.Types.ObjectId, ref: 'Answer'}],
    viewers: [
        {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
    ],
    category: {type: String, enum: global.questionCategories}
});

questionSchema.statics.formatQuestionsList = function (inputQuestions) {
    var outputQuestions = [];
    _.forEach(inputQuestions, function (question) {
        var out = {};
        out.questionId = question._id;
        out.askerId = question.asker;
        out.questionTitle = question.name;
        out.questionDescription = question.text;
        out.timeAsked = question.time;
        out.numAnswers = question.answers.length;
        out.numViews = question.viewers.length;
        out.numFavourites = question.favourites.length;
        out.category = question.category;
        outputQuestions.push(out);
    });
    return outputQuestions;
};

questionSchema.statics.format = function (question, done) {
    var out = {};
    question.populate('asker');
    question.populate('answers');
    out.asker = User.format(question.asker);
    out.questionId = question._id;
    out.questionTitle = question.name;
    out.questionDescription = question.text;
    out.category = question.category;
    out.numViews = question.viewers.length;
    out.time = question.time;
    out.numFavourites = question.favourites;
    out.answers = question.answers;
    done(null, out);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Question', questionSchema);