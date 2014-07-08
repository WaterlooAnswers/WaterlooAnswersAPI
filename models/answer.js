var mongoose = require('mongoose');

var answerSchema = mongoose.Schema({
	answerer: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	answererName: String,
  	text: String,
  	time : { type : Date, default: Date.now }
});

module.exports = mongoose.model('Answer', answerSchema);