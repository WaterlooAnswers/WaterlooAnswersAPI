module.exports = function (server, passport) {
    var app = server.app;
    createRestEndpoints(app, passport);
};

function createRestEndpoints(app, passport) {

    var rest = require('../app/restOperations')(passport);

    app.all('*', function (req, res, next) { //TODO REMOVE THIS BEFORE DEPLOYING
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });

    app.get('/api', function (req, res) {
        res.redirect("http://docs.waterlooanswers.apiary.io/");
    });

    app.get('/api/categories', rest.getCategories);

    app.get('/api/questions', rest.getQuestionSet);

    app.get('/api/questions/:id', rest.getQuestionById);

    app.delete('/api/questions', rest.deleteQuestionById);

    app.post('/api/questions', rest.postQuestion);

    app.put('/questions/:id/upvote', function (req, res) { // TODO Implement
        res.send("not implemented yet");
    });

    app.put('/questions/:id/downvote', function (req, res) { // TODO Implement
        res.send("not implemented yet");
    });

    app.post('/api/answers', rest.postAnswer);

    app.get('/api/user', rest.getUser);

    app.post('/api/login', rest.getLoginToken);

    app.post('/api/signup', rest.postSignup);

    app.all('/api/*', function (req, res) {
        res.status(404).json({error: "Invalid HTTP method or path, please refer to the API Documentation.", documentationUrl: "http://askuw.sahiljain.ca/api"});
        //TODO save typo urls in db
    });

}