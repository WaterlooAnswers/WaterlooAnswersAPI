var mongoose = require('mongoose');

global.questionCategories = [
    'Admissions/Program Advice',
'Campus Facilities',
'Co-op/Jobmine',
'Course Selection',
'Extracurriculars',
'Finances',
'General Advice',
'Homework/Exams',
'Parties/Student Life',
'Programming',
'Residence',
'Technology/Startups',
'Other'];

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