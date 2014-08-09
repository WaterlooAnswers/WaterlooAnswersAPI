var Question = require('../models/question');
var Answer = require('../models/answer');
var User = require('../models/user');

module.exports = function (server, passport) {

    var app = server.app;

    createRestEndpoints();

    app.get('/', isLoggedIn, function (req, res) {
        res.render('index.ejs', {user: req.user});
    });

    app.get("/upvote", isLoggedIn, function (req, res) {
        Question.findByIdAndUpdate(req.query.qid, {$inc: {votes: 1}}, function (err, question) {
            if (err) {
                res.send("error");
            } else {
                res.send("upsuccess");
            }
        });
    });

    app.get("/downvote", isLoggedIn, function (req, res) {
        Question.findByIdAndUpdate(req.query.qid, {$inc: {votes: -1}}, function (err, question) {
            if (err)console.log("could not update votes");
            console.log(question.votes.toString());
            res.end();
        });
    });

    app.get('/login', function (req, res) {
        res.render('login', {message: req.flash('loginMessage')});
    });

    app.get('/ask', isLoggedIn, function (req, res) {
        res.render('addquestion', {cats: Question.schema.path('category').enumValues});
    });

    app.get('/answer', isLoggedIn, function (req, res) {
        if (req.query.tab === "topfav") {
            Question.find().populate('asker', 'firstName').sort({favourites: -1}).exec(function (err, questions) {
                res.render('listquestions', {questions: questions, n: 2});
            });
        } else if (req.query.tab === "viewcategories") {
            res.render('viewcategories', {categories: Question.schema.path('category').enumValues, n: 3});
        } else {
            Question.find().populate('asker', 'firstName').sort({time: -1}).exec(function (err, questions) {
                console.log(questions);
                res.render('listquestions', {questions: questions, n: 1});
            });
        }
    });

    app.get('/viewquestion/*', isLoggedIn, function (req, res) {
        var id = req.url.split('/')[2];
        Question.findById(id).populate('answers').populate('asker').exec(function (err, q) {
            res.render('viewquestion', {question: q, message: req.flash('info')});
        });
    });

    app.get('/signup', function (req, res) {
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
    app.get('/profileRedirect', isLoggedIn, function (req, res) {
        res.redirect('/profile/' + req.user._id);
    });
    app.get('/profile/*', isLoggedIn, function (req, res) {
        var profile_id = req.url.split("/")[2];
        console.log(profile_id);
        var question = [];
        User.findById(profile_id).exec(function (err, doc) {
            if (!err) {
                console.log(doc);
                //res.render('profile', {user: doc});
                Question.find({'asker': doc._id}, function (err, docs) {
                    console.log(docs);
                    question = docs;
                    Answer.find({'answerer': doc._id}, function (err, docss) {
                        console.log("docss");
                        console.log(docss);

                        answer = docss;
                        //Question.find({'asker': answer[0].question}, function(err, docsss){
                        //console.log(docsss);
                        res.render('profile', {
                            questions: question,
                            answers: answer,
                            //questionAnswered: docsss,
                            user: doc});
                    });
                    //});
                    //res.render('profile', {questions: question, user: doc});
                });
            }
        });
    });


    Question.schema.path('category').enumValues.forEach(function (entry) {
        var val = entry.replace(/[^a-zA-Z0-9]/g, '');
        app.get('/category/' + val, isLoggedIn, function (req, res) {
            Question.find({category: entry}).populate('asker', 'firstName').exec(function (err, questions) {
                res.render('listcategory', {category: entry, questions: questions, user: req.user});
            });
        });
    });


    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.post('/login', passport.authenticate('local-login', {
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        successRedirect: '/',
        failureFlash: true, // allow flash messages
        session: true
    }));

    app.post('/ask', isLoggedIn, function (req, res) {
        var question = req.body.question.toString();
        var text = req.body.text.toString();
        var asker = req.user.id;
        var category = req.body.category.toString();
        var q1 = new Question({name: question, text: text, asker: asker, category: category});
        q1.save(function (err, q1) {
            if (err) {
                res.send("could not save question");
            }
            res.location('/viewquestion');
            req.flash('info', 'Question added successfully!');
            res.redirect('/viewquestion/' + q1._id);
        });
    });

    app.post('/addanswer', isLoggedIn, function (req, res) {
        var text = req.body.text.toString();
        var ans = new Answer({answerer: req.user.id, question: req.body.questionid, answererName: req.user.firstName, text: text});
        var qid = req.body.questionid;
        ans.save(function (err, ans1) {
            Question.findByIdAndUpdate(qid, {$push: {answers: ans._id}}, function (err, question) {
                if (err)console.log("could not update answer");
                console.log(question.answers.toString());
                res.location('/viewquestion');
                req.flash('info', 'Answer added successfully!');
                res.redirect('/viewquestion/' + qid);
            });
        });
    });

    app.use(function (req, res) {
        res.status(404);
        res.render('errorpage');
    });

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            res.locals.user = req.user;
            return next();
        }
        console.log(req.user);
        res.redirect('/login');
    }

    function createRestEndpoints() {

        app.get('/api', function (req, res) {
            res.redirect("http://docs.waterlooanswers.apiary.io/");
        });

        app.get('/api/categories', function (req, res) {
            res.json({categories: global.questionCategories});
        });

        app.get('/api/questions', function (req, res) {
            Question.find().populate('asker', 'firstName').exec(function (err, questions) {
                var output = [];
                questions.forEach(function (item) {
                    var currentOutput = {};
                    currentOutput.questionId = item._id;
                    currentOutput.name = item.name;
                    currentOutput.description = item.text;
                    currentOutput.askerName = item.asker.firstName;
                    currentOutput.askerId = item.asker._id;
                    currentOutput.category = item.category;
                    currentOutput.numAnswers = item.answers.length;
                    currentOutput.numVotes = item.votes;
                    currentOutput.timeAsked = item.time;
                    output.push(currentOutput);
                });
                res.json(output);
            });
        });

        app.get('/api/questions/:id', function (req, res) {
            var id = req.params.id;
            Question.findById(id).populate('answers').populate('asker').exec(function (err, item) {
                if (err) {
                    res.status(400).json({error: "Could not find question, please form your requests like the following: api/question/QUESTION_ID"});
                } else {
                    var currentOutput = {};
                    currentOutput.questionId = item._id;
                    currentOutput.name = item.name;
                    currentOutput.description = item.text;
                    currentOutput.askerName = item.asker.firstName;
                    currentOutput.askerId = item.asker._id;
                    currentOutput.askerEmail = item.asker.email;
                    currentOutput.category = item.category;
                    currentOutput.numAnswers = item.answers.length;
                    currentOutput.answers = [];
                    item.answers.forEach(function (answer) {
                        var currentAnswer = {};
                        currentAnswer.answererId = answer.answerer;
                        currentAnswer.text = answer.text;
                        currentAnswer.answerId = answer._id;
                        currentAnswer.timeAnswered = answer.time;
                        currentOutput.answers.push(currentAnswer);
                    });
                    currentOutput.favourites = item.favourites;
                    currentOutput.numVotes = item.votes;
                    currentOutput.timeAsked = item.time;
                    res.json(currentOutput);
                }
            });
        });

        app.post('/api/ask', function (req, res) {
            var questionTitle = req.body.questionTitle;
            if (isNullOrEmpty(questionTitle)) {
                res.status(400).json({error: "please provide 'questionTitle' property"});
                console.log("no title");
                return;
            }

            var text = req.body.questionDescription;
            if (isNullOrEmpty(text)) {
                res.status(400).json({error: "please provide 'questionDescription' property"});
                console.log("no desc");
                return;
            }

            var askerEmail = req.body.username.toLowerCase();
            if (isNullOrEmpty(askerEmail)) {
                res.status(400).json({error: "please provide 'username' property"});
                console.log("no username");
                return;
            }

            var askerPassword = req.body.password;
            if (isNullOrEmpty(askerPassword)) {
                res.status(400).json({error: "please provide 'password' property"});
                console.log("no password");
                return;
            }

            var category = global.questionCategories[req.body.categoryIndex];
            if (isNullOrEmpty(category)) {
                res.status(400).json({error: "please provide valid 'categoryIndex' number"});
                console.log("no category index");
                return;
            }

            User.findOne({email: askerEmail}, function (err, doc) {
                if (err || !doc) {
                    res.status(401).json({error: "incorrect username or password"});
                } else {
                    if (doc.validPassword(askerPassword)) {
                        var q1 = new Question({name: questionTitle, text: text, asker: doc._id, category: category});
                        q1.save(function (err, q1) {
                            if (err) {
                                res.status(500).json({error: "could not save question"});
                            } else {
                                res.json({result: "Successfully added question!", questionId: q1._id});
                            }
                        });
                    } else {
                        res.status(401).json({error: "incorrect username or password"});
                    }
                }
            });
        });

        app.post('/api/addanswer', function (req, res) {
            var username = req.body.username;
            if (isNullOrEmpty(username)) {
                res.status(400).json({error: "please provide 'username' property"});
                console.log("no username");
                return;
            }

            var password = req.body.password;
            if (isNullOrEmpty(password)) {
                res.status(400).json({error: "please provide 'password' property"});
                console.log("no password");
                return;
            }

            var questionId = req.body.questionId;
            if (isNullOrEmpty(questionId)) {
                res.status(400).json({error: "please provide 'questionId' property"});
                console.log("no questionId");
                return;
            }

            var text = req.body.answerBody;
            if (isNullOrEmpty(text)) {
                res.status(400).json({error: "please provide 'answerBody' property"});
                console.log("no text");
                return;
            }

            User.findOne({email: username}, function (err, doc) {
                if (err || !doc) {
                    res.status(401).json({error: "incorrect username or password"});
                } else {
                    if (doc.validPassword(password)) {
                        var ans = new Answer({answerer: doc._id, question: questionId, answererName: doc.firstName, text: text});
                        ans.save(function (err, answerSaved) {
                            if (err) {
                                res.status(500).json({error: "could not save answer"});
                            } else {
                                Question.findByIdAndUpdate(questionId, {$push: {answers: answerSaved._id}}, function (err, question) {
                                    if (err) {
                                        res.status(500).json({error: "could not save answer"});
                                    } else {
                                        res.json({result: "Successfully added answer!", questionId: question._id, answerId: answerSaved._id});
                                    }
                                });
                            }
                        });
                    } else {
                        res.status(401).json({error: "incorrect username or password"});
                    }
                }
            });
        });
    }
};

function isNullOrEmpty(string) {
    if (!string) return true;
    return !/\S/.test(string);
}
