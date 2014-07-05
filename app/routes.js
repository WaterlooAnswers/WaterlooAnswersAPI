var Question = require('../models/question');
var Answer = require('../models/answer');
var User = require('../models/user');

module.exports = function(server, passport){


  app = server.app;
	app.get('/', isLoggedIn, function(req, res) {  
    res.render('index.ejs', {user: req.user});
  });

  app.get("/upvote", function(req, res){
    Question.findByIdAndUpdate(req.query.qid, {$inc: {votes: 1}}, function(err, question){
      if(err){
        res.send("error");
      }else{
        res.send("upsuccess");
      }
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
    res.render('addquestion', {cats :Question.schema.path('category').enumValues});   
  });

  //heyy

  /*app.get('/learn', isLoggedIn, function(req, res){
    Question.find({}, function(err, questions){
      res.render('listquestions', {questions: questions});
    });
  });*/

  app.get('/answer', isLoggedIn, function(req, res){
    if(req.query.tab === "topfav"){
      Question.find().populate('asker','firstName').sort({favourites: -1}).exec(function(err,questions){
        res.render('listquestions', {questions: questions, n:2});
      });
    }else if(req.query.tab === "viewcategories"){
        res.render('viewcategories', {categories: Question.schema.path('category').enumValues, n:3});
    }else{
      Question.find().populate('asker','firstName').sort({time: -1}).exec(function(err,questions){
        res.render('listquestions', {questions: questions, n:1});
      });
    }

    
  });

  app.get('/viewquestion/*', isLoggedIn, function(req, res){
    var id = req.url.split('/')[2];
    console.log(req.url);
    console.log(id);
    Question.findById(id).populate('answers').populate('asker', 'firstName').exec(function(err, q){
      console.log(q);
      res.render('viewquestion', {question: q, message: req.flash('info')});
    });
  });

app.get('/signup', function(req, res){
  res.render('signup.ejs', {message: req.flash('signupMessage')});
});

app.get('/logout', function(req,res){
  req.logout();
  res.redirect('/');
});
  app.get('/profileRedirect', isLoggedIn, function(req, res) {
    res.redirect('/profile/' + req.user._id);
  });
app.get('/profile/*', isLoggedIn, function(req, res){
  var profile_id = req.url.split("/")[2];
  console.log(profile_id);
  var question;
  User.findById(req.user._id).exec(function(err,doc){
    if(!err){
      console.log(doc);
      res.render('profile', {user: doc});
   /* Question.find({'asker': doc._id}, function(err, docs){
      console.log(docs);
      res.render('profile', {questions: docs, user: doc});
      });
      res.render('profile', {questions: question, user: doc});
    }
  });*/
}
});
});
Question.schema.path('category').enumValues.forEach(function(entry){
  var val = entry.replace(/[^a-zA-Z0-9]/g, '');
  app.get('/category/'+ val, isLoggedIn, function(req,res){
    Question.find({category: entry}).populate('asker','firstName').exec(function(err,questions){
      res.render('listcategory', {category: entry, questions: questions, user:req.user});
    });
  });
});


app.post('/signup', passport.authenticate('local-signup', {
          successRedirect : '/', // redirect to the secure profile section
          failureRedirect : '/signup', // redirect back to the signup page if there is an error
          failureFlash : true // allow flash messages
        }));

app.post('/login', passport.authenticate('local-login', {
          failureRedirect : '/login', // redirect back to the signup page if there is an error
          successRedirect : '/',
          failureFlash : true, // allow flash messages
          session: true
        }));

app.post('/ask', function(req,res){
  var question = req.body.question.toString();
  var text = req.body.text.toString();
  var asker = req.user.id;
  var category = req.body.category.toString();
  var q1 = new Question({name: question, text: text, asker: asker, category: category});
  q1.save(function(err, q1){
    if (err) {
      res.send("could not save question");
    };
    res.location('/viewquestion');
    req.flash('info', 'Question added successfully!');
    res.redirect('/viewquestion/'+q1._id);
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
     res.redirect('/viewquestion/' + qid);
   });
  });
});

app.use(function(req, res) {
  res.status(404);
  res.render('errorpage');
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    res.locals.user = req.user;
    return next();
  }
  console.log(req.user);
  res.redirect('/login');
};

};

