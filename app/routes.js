var Constants = require('../constants');

module.exports = function (server, passport) {
    var app = server.app;
    createRestEndpoints(app, passport);
};

function createRestEndpoints(app, passport) {

    var userOperations = require('../app/userOperations')(passport);
    var questionOperations = require('../app/questionOperations')();
    var answerOperations = require('../app/answerOperations')();
    var otherOperations = require('../app/otherOperations')();

    app.all('*', function (req, res, next) { //TODO REMOVE THIS BEFORE DEPLOYING
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });

    app.get('/api', function (req, res) {
        res.redirect(Constants.URLS.API_DOC);
    });

    app.get('/api/categories', otherOperations.getCategories);

    app.get('/api/questions', questionOperations.getQuestionSet);

    app.get('/api/questions/:id', questionOperations.getQuestionById);

    app.delete('/api/questions', questionOperations.deleteQuestionById);

    app.post('/api/questions', questionOperations.postQuestion);

    app.put('/questions/:id/upvote', function (req, res) { // TODO Implement
        res.send(Constants.ERROR.FEATURE_NOT_IMPLEMENTED);
    });

    app.put('/questions/:id/downvote', function (req, res) { // TODO Implement
        res.send(Constants.ERROR.FEATURE_NOT_IMPLEMENTED);
    });

    app.post('/api/answers', answerOperations.postAnswer);

    app.get('/api/user', userOperations.getUser);

    app.get('/api/user/:id', userOperations.getUserById);

    app.post('/api/login', userOperations.getLoginToken);

    app.post('/api/signup', userOperations.postSignup);

    app.all('/api/*', function (req, res) {
        res.status(404).json({error: Constants.ERROR.INVALID.HTTP_METHOD, documentationUrl: Constants.URLS.API_DOC});
    });

}