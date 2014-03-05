var mongoose = require('mongoose');

var questionSchema = mongoose.Schema({
	asker: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	name: String,
	votes: {type: Number, min:0, default:0},
	text: String,
	time : { type : Date, default: Date.now },
	answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Question', questionSchema);