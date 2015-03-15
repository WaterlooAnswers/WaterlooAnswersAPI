/**
 * Created by Sahil Jain on 02/09/2014.
 */

process.env.NODE_ENV = 'test';

var request = require('supertest');
var app = require('../../server');
var jwt = require('jwt-simple');
var dbUtils = require('../../utils/databaseutils');
var Constants = require('../../constants');
var tokenUtils = require('../../utils/tokenutils');
var _ = require('lodash');

describe('User Endpoints', function () {

    describe('POST /signup', function () {
        before(function (done) {
            dbUtils.clearUserCollection(done);
        });
        it('should return error if no email provided', function (done) {
            request(app).post('/api/signup').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.EMAIL);
                done();
            });
        });
        it('should return error if no password provided', function (done) {
            request(app).post('/api/signup?email=hello').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.PASSWORD);
                done();
            });
        });
        it('should return error if no firstName provided', function (done) {
            request(app).post('/api/signup?email=hello&password=hello').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.FIRST_NAME);
                done();
            });
        });
        it('should create user if credentials provided', function (done) {
            request(app).post('/api/signup?email=hello&password=hello&firstName=hello').expect(200).end(function (err, res) {
                res.body.username.should.equal("hello");
                res.body.firstName.should.equal("hello");
                res.body.token.should.not.be.empty;
                var decoded = jwt.decode(res.body.token, "testsecret");
                decoded.userId.should.not.be.empty;
                done();
            });
        });
        it('should not create user if email already in use', function (done) {
            request(app).post('/api/signup?email=hello&password=hello&firstName=hello').expect(401).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.EMAIL_IN_USE);
                done();
            });
        });
        after(function (done) {
            dbUtils.clearUserCollection(done);
        });
    });

    describe("POST /login", function () {
        var user;
        before(function (done) {
            dbUtils.createTestUser("testemail", "testpassword", "testfirstname", function (doc) {
                user = doc;
                done();
            });
        });
        after(function (done) {
            dbUtils.clearUserCollection(done);
        });
        it("should not log in with missing credentials", function (done) {
            request(app).post('/api/login?email=hello').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.PASSWORD);
                done();
            });
        });
        it("should not log in with invalid credentials", function (done) {
            request(app).post('/api/login?email=hello&password=hello').expect(401).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.INVALID.EMAIL_OR_PASSWORD);
                done();
            });
        });
        it("should log in with valid credentials and give back token", function (done) {
            request(app).post('/api/login?email=testemail&password=testpassword').expect(200).end(function (err, res) {
                res.body.token.should.not.be.empty;
                var decoded = jwt.decode(res.body.token, "testsecret");
                decoded.userId.should.equal(String(user._id));
                done();
            });
        });
    });

    describe("GET /user", function () {
        var user;
        var token;
        var question;
        var answer;
        before(function (done) {
            dbUtils.createTestUser("testemail", "testpassword", "testfirstname", function (doc) {
                user = doc;
                token = tokenUtils.generateTokenFromUser(user);
                dbUtils.createQuestion("testquestiontitle", "testquestiontext", user._id, 1, function (questionDoc) {
                    question = questionDoc;
                    dbUtils.createAnswer(question, user, "testanswertext", function (answerDoc) {
                        answer = answerDoc;
                        done();
                    });
                });
            });
        });
        after(function (done) {
            dbUtils.clearUserCollection(function () {
                dbUtils.clearQuestionCollection(function () {
                    dbUtils.clearAnswerCollection(done);
                });
            });
        });
        it ('should give missing token error if missing token', function (done) {
            request(app).get('/api/user').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.TOKEN);
                done();
            });
        });
        it ('should give invalid token error if token is invalid', function (done) {
            request(app).get('/api/user?token=blahoo').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.INVALID.TOKEN);
                done();
            });
        });
        it ('should give user if valid token', function (done) {
            request(app).get('/api/user?token=' + token).expect(400).end(function (err, res) {
                Date.parse(res.body.dateJoined).should.equal(user.dateCreated.getTime());
                res.body.email.should.equal("testemail");
                res.body.firstName.should.equal("testfirstname");
                res.body.userId.should.equal(user._id.toString());
                res.body.questionsAsked.length.should.equal(1);
                res.body.questionsAsked[0].numAnswers.should.equal(1);
                res.body.answersGiven.length.should.equal(1);

                var questionAsked = res.body.questionsAsked[0];
                questionAsked.questionId.should.equal(question._id.toString());
                questionAsked.askerId.should.equal(user._id.toString());
                questionAsked.category.should.equal(global.questionCategories[1]);
                questionAsked.numAnswers.should.equal(1);
                questionAsked.questionTitle.should.equal('testquestiontitle');
                questionAsked.questionDescription.should.equal('testquestiontext');

                var answerGiven = res.body.answersGiven[0];
                answerGiven.answerId.should.equal(answer._id.toString());
                answerGiven.answerText.should.equal(answer.text.toString());
                Date.parse(answerGiven.answerTime).should.equal(answer.time.getTime());
                answerGiven.questionDescription.should.equal(question.text);
                answerGiven.questionId.should.equal(question._id.toString());
                answerGiven.questionTitle.should.equal(question.name);
                done();
            });
        });
    });

    describe("GET /user/:id", function () {
        var user;
        var token;
        var question;
        var answer;
        before(function (done) {
            dbUtils.createTestUser("testemail", "testpassword", "testfirstname", function (doc) {
                user = doc;
                token = tokenUtils.generateTokenFromUser(user);
                dbUtils.createQuestion("testquestiontitle", "testquestiontext", user._id, 1, function (questionDoc) {
                    question = questionDoc;
                    dbUtils.createAnswer(question, user, "testanswertext", function (answerDoc) {
                        answer = answerDoc;
                        done();
                    });
                });
            });
        });
        after(function (done) {
            dbUtils.clearUserCollection(function () {
                dbUtils.clearQuestionCollection(function () {
                    dbUtils.clearAnswerCollection(done);
                });
            });
        });
        it ('should give missing token error if missing token', function (done) {
            request(app).get('/api/user/' + user._id).expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.TOKEN);
                done();
            });
        });
        it ('should give invalid token error if token is invalid', function (done) {
            request(app).get('/api/user?token=blahoo').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.INVALID.TOKEN);
                done();
            });
        });
        it ('should give user if valid id and token', function (done) {
            request(app).get('/api/user/' + user._id + '?token=' + token).expect(400).end(function (err, res) {
                Date.parse(res.body.dateJoined).should.equal(user.dateCreated.getTime());
                res.body.email.should.equal("testemail");
                res.body.firstName.should.equal("testfirstname");
                res.body.userId.should.equal(user._id.toString());
                res.body.questionsAsked.length.should.equal(1);
                res.body.questionsAsked[0].numAnswers.should.equal(1);
                res.body.answersGiven.length.should.equal(1);

                var questionAsked = res.body.questionsAsked[0];
                questionAsked.questionId.should.equal(question._id.toString());
                questionAsked.askerId.should.equal(user._id.toString());
                questionAsked.category.should.equal(global.questionCategories[1]);
                questionAsked.numAnswers.should.equal(1);
                questionAsked.questionTitle.should.equal('testquestiontitle');
                questionAsked.questionDescription.should.equal('testquestiontext');

                var answerGiven = res.body.answersGiven[0];
                answerGiven.answerId.should.equal(answer._id.toString());
                answerGiven.answerText.should.equal(answer.text.toString());
                Date.parse(answerGiven.answerTime).should.equal(answer.time.getTime());
                answerGiven.questionDescription.should.equal(question.text);
                answerGiven.questionId.should.equal(question._id.toString());
                answerGiven.questionTitle.should.equal(question.name);
                done();
            });
        });
    });
});
