var mongoose = require('mongoose');
var Question = require('./question');

var answerSchema = mongoose.Schema({
    answerer: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    upvoters: [
        {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
    ],
    downvoters: [
        {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
    ],
    text: String,
    time: { type: Date, default: Date.now }
});

answerSchema.statics.format = function(answer, done) {
    var out = {};
    Question.findOne({answers: answer._id}, function (err, questionAnswered) {
        if (err || !questionAnswered) {
            return done(err, null);
        } else {
            out.questionId = questionAnswered._id;
            out.questionTitle = questionAnswered.name;
            out.questionDescription = questionAnswered.text;
            out.answerId = answer._id;
            out.answerText = answer.text;
            out.answerTime = answer.time;
            return done(null, out);
        }
    });
};

module.exports = mongoose.model('Answer', answerSchema);