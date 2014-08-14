var mongoose = require('mongoose');

var answerSchema = mongoose.Schema({
    answerer: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    upvoters: [
        {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
    ],
    numUpvotes: Number,
    downvoters: [
        {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
    ],
    numUpvotes: Number,
    text: String,
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Answer', answerSchema);