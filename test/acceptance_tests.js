/**
 * Created by Sahil Jain on 01/09/2014.
 */

process.env.NODE_ENV = 'test';

var assert = require("assert");
var request = require('supertest');
var should = require('should');
var app = require('../server');
var mongoose = require('mongoose');
var jwt = require('jwt-simple');
var User = require('../models/user');
var Question = require('../models/question');

describe('API Tests (Acceptance Tests)', function () {
    describe('GET /categories', function () {
        it('should have 13 categories', function (done) {
            request(app).get('/api/categories').expect(200).end(function (err, res) {
                res.body.should.have.lengthOf(13);
                for (var i = 0; i < res.body.length; i++) {
                    res.body[i].categoryId.should.equal(i);
                    res.body[i].should.have.property("categoryName");
                }
                done();
            });
        })
    });
    describe('GET /api', function () {
        it('should redirect to docs', function (done) {
            request(app).get('/api').expect(200).end(function (err, res) {
                res.headers.location.should.equal("http://docs.waterlooanswers.apiary.io/");
                done();
            });
        });
    });
    describe('GET /blahblahblah', function () {
        it('should give error json', function (done) {
            request(app).get('/api/blahblahblah').expect(404).end(function (err, res) {
                res.body.error.should.equal("Invalid HTTP method or path, please refer to the API Documentation.");
                done();
            });
        });
    });
    describe('POST /signup', function () {
        before(function (done) {
            clearUserCollection(done);
        });
        it('should return error when no username provided', function (done) {
            request(app).post('/api/signup').expect(400).end(function (err, res) {
                res.body.error.should.equal("Could not create user. Please provide username");
                done();
            });
        });
        it('should return error when no password provided', function (done) {
            request(app).post('/api/signup?email=hello').expect(400).end(function (err, res) {
                res.body.error.should.equal("Could not create user. Please provide password");
                done();
            });
        });
        it('should return error when no firstName provided', function (done) {
            request(app).post('/api/signup?email=hello&password=hello').expect(400).end(function (err, res) {
                res.body.error.should.equal("Could not create user. Please provide firstName");
                done();
            });
        });
        it('should create user when credentials provided', function (done) {
            request(app).post('/api/signup?email=hello&password=hello&firstName=hello').expect(200).end(function (err, res) {
                res.body.username.should.equal("hello");
                res.body.firstName.should.equal("hello");
                res.body.token.should.not.be.empty;
                var decoded = jwt.decode(res.body.token, "testsecret");
                decoded.userId.should.not.be.empty;
                done();
            });
        });
        it('should not create user when email already in use', function (done) {
            request(app).post('/api/signup?email=hello&password=hello&firstName=hello').expect(401).end(function (err, res) {
                res.body.error.should.equal("email already in use");
                done();
            });
        });
        after(function (done) {
            clearUserCollection(done);
        });
    });
    describe("POST /login", function () {
        var user;
        before(function (done) {
            createTestUser("testemail", "testpassword", "testfirstname", function (doc) {
                user = doc;
                done();
            });
        });
        after(function (done) {
            clearUserCollection(done);
        });
        it("should not log in with missing credentials", function (done) {
            request(app).post('/api/login?email=hello').expect(400).end(function (err, res) {
                res.body.error.should.equal("please provide an email and password");
                done();
            });
        });
        it("should not log in with invalid credentials", function (done) {
            request(app).post('/api/login?email=hello&password=hello').expect(401).end(function (err, res) {
                res.body.error.should.equal("invalid username or password");
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
    describe("POST /questions", function () {
        var user;
        before(function (done) {
            createTestUser("email", "password", "firstName", function (newUser) {
                user = newUser;
                done();
            });
        });
        after(function (done) {
            clearUserCollection(function () {
                clearQuestionCollection(done);
            });
        });
        it("should not post if missing questionTitle", function (done) {
            request(app).post('/api/questions').expect(400).end(function (err, res) {
                res.body.error.should.equal("please provide 'questionTitle' property");
                done();
            });
        });
        it("should not post if missing questionDescription", function (done) {
            request(app).post('/api/questions').send({questionTitle: "title"}).expect(400).end(function (err, res) {
                res.body.error.should.equal("please provide 'questionDescription' property");
                done();
            });
        });
        it("should not post if missing categoryIndex", function (done) {
            request(app).post('/api/questions').send({questionTitle: "title", questionDescription: "description"}).expect(400).end(function (err, res) {
                res.body.error.should.equal("please provide valid 'categoryIndex' number");
                done();
            });
        });
        it("should not post if missing token", function (done) {
            request(app).post('/api/questions').send({questionTitle: "title", questionDescription: "description", categoryIndex: 2}).expect(400).end(function (err, res) {
                res.body.error.should.equal("please provide valid 'token'");
                done();
            });
        });
        it("should not post if invalid token", function (done) {
            request(app).post('/api/questions').send({questionTitle: "title", questionDescription: "description", categoryIndex: 2, token: "blahblahblah"}).expect(400).end(function (err, res) {
                res.body.error.should.equal("invalid token");
                done();
            });
        });
        it("should post question when given valid info", function (done) {
            var token = jwt.encode({userId: user._id}, "testsecret");
            token.should.not.be.empty;
            request(app).post('/api/questions').send({questionTitle: "title", questionDescription: "description", categoryIndex: 2, token: token}).expect(200).end(function (err, res) {
                res.body.result.should.equal("Successfully added question!");
                Question.find({}, function (err, docs) {
                    should.not.exist(err);
                    docs.length.should.equal(1);
                    done();
                });
            });
        });
    });
    describe("DELETE /questions", function () {
        var question;
        var user;
        before(function (done) {
            createTestUser("email", "password", "firstName", function (newUser) {
                user = newUser;
                createTestQuestion("title", "description", user._id, 1, function (doc) {
                    question = doc;
                    done();
                });
            });
        });
        after(function (done) {
            clearUserCollection(function () {
                clearQuestionCollection(done);
            });
        });
        it("should not delete if invalid token", function (done) {
            request(app).delete('/api/questions').send({id: "blah"}).expect(401).end(function (err, res) {
                res.body.error.should.equal("please give a valid token");
                Question.find({}, function (err, docs) {
                    should.not.exist(err);
                    docs.length.should.equal(1);
                    done();
                });
            });
        });
        it("should not delete if invalid id", function (done) {
            request(app).delete('/api/questions').send({id: "blah", token: jwt.encode({userId: user._id}, "testsecret")}).expect(400).end(function (err, res) {
                res.body.error.should.equal("Could not find question, please form your requests according to the documentation");
                Question.find({}, function (err, docs) {
                    should.not.exist(err);
                    docs.length.should.equal(1);
                    done();
                });
            });
        });
        it("should delete if valid id and token", function (done) {
            request(app).delete('/api/questions').send({id: question._id, token: jwt.encode({userId: user._id}, "testsecret")}).expect(204).end(function (err, res) {
                Question.find({}, function (err, docs) {
                    should.not.exist(err);
                    docs.length.should.equal(0);
                    done();
                });
            });
        });
    });
});

function createTestUser(email, password, firstName, done) {
    var newUser = new User();
    newUser.email = email;
    newUser.password = newUser.generateHash(password);
    newUser.firstName = firstName;
    newUser.dateCreated = Date.now();
    newUser.save(function (err) {
        if (err) {
            console.log("error creating user");
            throw err;
        }
        return done(newUser);
    });
}

function createTestQuestion(questionTitle, text, askerId, categoryIndex, done) {
    var q1 = new Question({name: questionTitle, text: text, asker: askerId, category: global.questionCategories[categoryIndex]});
    q1.save(function (err, question) {
        if (err) {
            throw err;
        } else {
            done(question);
        }
    });
}

function clearUserCollection(done) {
    mongoose.connection.collections.users.remove(function () {
        return done();
    });
}

function clearQuestionCollection(done) {
    mongoose.connection.collections.questions.remove(function () {
        return done();
    });
}