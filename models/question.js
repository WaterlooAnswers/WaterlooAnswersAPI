var mongoose = require('mongoose');
var _ = require('lodash');

global.questionCategories = [
    'SE212', 'ECE222', 'CS241', 'STAT206', 'CHE102'
];

var questionSchema = mongoose.Schema({
	asker: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	name: String,
	favourites: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    numFavourites: Number, //TODO-sahil remove
	text: String,
	time : { type : Date, default: Date.now },
	answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
    numAnswers: Number, //TODO-sahil remove
    viewers: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    numViews: Number, //TODO-sahil remove
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

// create the model for users and expose it to our app
module.exports = mongoose.model('Question', questionSchema);