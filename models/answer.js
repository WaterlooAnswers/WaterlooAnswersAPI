var mongoose = require('mongoose');

var answerSchema = mongoose.Schema({
	answerer: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	question: {type: mongoose.Schema.Types.ObjectId, ref: 'Question'},
	questionName: String,
	answererName: String,
  	text: String,
  	time : { type : Date, default: Date.now }
});

module.exports = mongoose.model('Answer', answerSchema);