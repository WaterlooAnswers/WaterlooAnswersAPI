var mongoose = require('mongoose');

var questionSchema = mongoose.Schema({
	asker: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	name: String,
	text: String,
	answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Question', questionSchema);