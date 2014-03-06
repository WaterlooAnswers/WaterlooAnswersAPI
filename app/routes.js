var Question = require('../models/question');
var Answer = require('../models/answer');

module.exports = function(app, passport){

	    app.get('/', function(req, res) {
            if(req.isAuthenticated()){
              res.redirect('/home');
            }else{
              res.redirect('/login');
            }
        });

        app.get("/upvote", function(req, res){

          console.log(req.query.qid);
          //persist to databse
              Question.findByIdAndUpdate(req.query.qid, {$inc: {votes: 1}}, function(err, question){
               if(err)console.log("could not update votes");
               console.log(question.votes.toString());
               res.end();
              });
        });

        app.get("/downvote", function(req, res){
          //persist to databse
              Question.findByIdAndUpdate(req.query.qid, {$inc: {votes: -1}}, function(err, question){
               if(err)console.log("could not update votes");
               console.log(question.votes.toString());
               res.end();
              });
        });

        app.get('/login', function(req, res){
          res.render('login', {message: req.flash('loginMessage')});
        });

        app.get('/ask', isLoggedIn, function(req, res) {
          res.render('addquestion', {user: req.user, cats :Question.schema.path('category').enumValues});   
        });

        app.get('/learn', isLoggedIn, function(req, res){
          Question.find({}, function(err, questions){
            res.render('listquestions', {questions: questions, user: req.user});
            });
        });

        app.get('/answer', isLoggedIn, function(req, res){
          Question.find({}, function(err, questions){
            res.render('listquestions', {questions: questions, user:req.user});
            });
        });

        app.get('/viewquestion', isLoggedIn, function(req, res){
          Question.findById(req.query.id).populate('answers').populate('asker', 'firstName').exec(function(err, q){
            res.render('viewquestion', {user: req.user, question: q, message: req.flash('info')});
          });
        });

        app.get('/addanswer', isLoggedIn, function(req, res){
          Question.findById(req.query.id).populate('answers').exec(function(err, q){
            res.render('addanswer', {question: q, user: req.user});
          });
        });

        app.get('/signup', function(req, res){
          res.render('signup.ejs', {message: req.flash('signupMessage')});
        });

        app.get('/home', isLoggedIn, function(req, res){
          res.render('index.ejs', {user: req.user});
        });

        app.get('/loginsuccess', function(req, res){
          res.render('index.ejs', {user: req.user});
        });

        app.get('/logout', function(req,res){
          req.logout();
          res.redirect('/');
        });

        app.get('/profile', isLoggedIn, function(req, res){
          console.log(req);
          Question.find({'asker': req.user._id}, function(err, docs){
            res.render('profile', {user: req.user, questions: docs});
          });
          
        });

        app.post('/signup', passport.authenticate('local-signup', {
          successRedirect : '/loginsuccess', // redirect to the secure profile section
          failureRedirect : '/signup', // redirect back to the signup page if there is an error
          failureFlash : true // allow flash messages
        }));

        app.post('/login', passport.authenticate('local-login', {
          failureRedirect : '/loginfail', // redirect back to the signup page if there is an error
          failureFlash : true, // allow flash messages
          session: true
        }), function(req,res){
          res.render('index.ejs', {user: req.user});
        });
  
        app.post('/ask', function(req,res){
            var name = req.body.name.toString();
            var text = req.body.text.toString();
            var asker = req.user.id;
            var q1 = new Question({name: name, text: text, asker: asker});
            q1.save(function(err, q1){
              if (err) {
                res.send("could not save question");
              };
              res.location('/viewquestion');
              req.flash('info', 'Question added successfully!');
              res.redirect('/viewquestion?id='+q1._id);
            });
        });

        app.post('/addanswer', function(req,res){
            var text = req.body.text.toString();
            var ans = new Answer({answerer: req.user.id,text: text});
            var qid = req.body.questionid;
            ans.save(function(err, ans1){
              Question.findByIdAndUpdate(qid, {$push: {answers: ans._id}}, function(err, question){
               if(err)console.log("could not update answer");
               console.log(question.answers.toString());
              res.location('/viewquestion');
              req.flash('info', 'Answer added successfully!');
              res.redirect('/viewquestion?id=' + qid);
              });
            });
        });

        app.use(function(req, res) {
            res.status(404);
            res.render('errorpage');
        });

};

    function isLoggedIn(req, res, next){
      if(req.isAuthenticated()){
        return next();
      }
      console.log(req.user);
      res.redirect('/login');
    };