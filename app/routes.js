var Question = require('../models/question');
var Answer = require('../models/answer');
var User = require('../models/user');
var jwt = require('jwt-simple');

module.exports = function (server, passport) {

    var app = server.app;

    createRestEndpoints(app, passport);
    createWebsiteEndpoints(app, passport);

};

function createWebsiteEndpoints(app, passport) {
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
                Question.find({'asker': doc._id}, function (err, docs) {
                    console.log(docs);
                    question = docs;
                    Answer.find({'answerer': doc._id}, function (err, docss) {
                        var answer = docss;
                        res.render('profile', {
                            questions: question,
                            answers: answer,
                            user: doc});
                    });
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
}

function createRestEndpoints(app, passport) {


    app.all('*', function(req, res, next) { //TODO REMOVE THIS BEFORE DEPLOYING
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });

    app.get('/api', function (req, res) {
        res.redirect("http://docs.waterlooanswers.apiary.io/");
    });

    app.get('/api/categories', function (req, res) {
        var output = [];
        for (var i = 0; i < global.questionCategories.length; i++) {
            output.push({categoryId: i, categoryName: global.questionCategories[i]});
        }
        res.json(output);
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

    app.delete('/api/questions', function (req, res) {
        var id = req.body.id;
        var token = req.body.token;
        if (!id) {
            return res.status(400).json({error: "please give a question id"});
        }
        if (!token) {
            return res.status(400).json({error: "please give a valid token"});
        }
        getUserFromToken(token, function (err, user) {
            if (!user) {
                return res.status(400).json({error: "Invalid token"});
            } else {
                Question.remove({_id: id, asker: user._id}, function (err, doc) {
                    if (err) {
                        res.status(400).json({error: "Could not find question, please form your requests according to the documentation"});
                    } else {
                        res.status(204).send();
                    }
                })
            }
        });
    });

    app.post('/api/questions', function (req, res) {
        var questionTitle = req.body.questionTitle;
        if (isNullOrEmpty(questionTitle)) {
            res.status(400).json({error: "please provide 'questionTitle' property"});
            return;
        }

        var text = req.body.questionDescription;
        if (isNullOrEmpty(text)) {
            res.status(400).json({error: "please provide 'questionDescription' property"});
            return;
        }

        var category = global.questionCategories[req.body.categoryIndex];
        if (isNullOrEmpty(category)) {
            res.status(400).json({error: "please provide valid 'categoryIndex' number"});
            return;
        }

        var token = req.body.token;
        if (isNullOrEmpty(category)) {
            res.status(400).json({error: "please provide valid 'token'"});
            return;
        }

        getUserFromToken(token, function (err, user) {
            if (err || !user) {
                return res.status(401).json({error: "invalid token"});
            }

            var q1 = new Question({name: questionTitle, text: text, asker: user._id, category: category});
            q1.save(function (err, q1) {
                if (err) {
                    res.status(500).json({error: "could not save question"});
                } else {
                    res.json({result: "Successfully added question!", questionId: q1._id});
                }
            });
        });
    });

    app.put('/questions/:id/upvote', function (req, res) { // TODO Implement
        res.send("not implemented yet");
    });

    app.get('/api/user', function (req, res) {
        var token = req.query.token;
        if (isNullOrEmpty(token)) {
            return res.status(400).json({error: "please provide 'token' property"});
        }

        getUserFromToken(token, function(err, doc) {
            var out = {};
            out.firstName = doc.firstName;
            out.userId = doc._id;
            out.dateCreated = doc.dateCreated;
            return res.json(out);
        });
    });

    app.post('/api/answers', function (req, res) {
        var token = req.body.token;
        if (isNullOrEmpty(token)) {
            res.status(400).json({error: "please provide 'token' property"});
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

        getUserFromToken(token, function (err, doc) { //FIXME there's currently a link between question->answer and answer->question, make it one way
            if (err || !doc) {
                res.status(401).json({error: "incorrect token"});
            } else {
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
            }
        });
    });

    app.post('/api/login', function (req, res, next) {
        passport.authenticate('local-login', {session: false}, function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({error: "invalid username or password"});
            }
            var token = generateTokenFromUser(user);
            res.json({token: token});
        })(req, res, next);
    });

    app.post('/api/signup', function (req, res, next) {
        passport.authenticate('local-signup', {session: false}, function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({error: "did not create user"});
            }
            var token = generateTokenFromUser(user);
            res.json({success: true, username: user.email, firstName: user.firstName, token: token});
        })(req, res, next);
    });

    app.all('/api/*', function (req, res) {
        res.status(404).json({error: "Invalid HTTP method or path, please refer to the API Documentation.", documentationUrl: "http://askuw.sahiljain.ca/api"});
        //TODO save typos in db
    });
}

function generateTokenFromUser(user) {
    return jwt.encode({userId: user._id}, "mysecret");
}

function getUserFromToken(token, next) {
    var id;
    try {
        id = jwt.decode(token, "mysecret");
    } catch (ex) {
        return next(true, null);
    }
    User.findById(id.userId, function (err, doc) {
        next(err, doc);
    });
}

function isNullOrEmpty(string) {
    if (!string) return true;
    return !/\S/.test(string);
}

