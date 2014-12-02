var mongoose = require('mongoose');

global.questionCategories = [
    'SE212', 'ECE222', 'CS241', 'STAT206', 'CHE102'
];

var questionSchema = mongoose.Schema({
	asker: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	name: String,
	favourites: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    numFavourites: Number,
	text: String,
	time : { type : Date, default: Date.now },
	answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
    numAnswers: Number,
    viewers: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    numViews: Number,
    category: {type: String, enum: global.questionCategories}
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Question', questionSchema);