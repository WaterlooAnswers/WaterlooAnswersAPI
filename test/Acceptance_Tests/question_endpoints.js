/**
 * Created by Sahil Jain on 02/09/2014. 
 */
process.env.NODE_ENV = 'test';

var request = require('supertest');
var should = require('should');
var app = require('../../server');
var jwt = require('jwt-simple');
var User = require('../../models/user');
var Question = require('../../models/question');
var dbUtils = require('../test_db_utils');

describe('Question Endpoints', function () {
    describe("POST /questions", function () {
        var user;
        before(function (done) {
            dbUtils.createTestUser("email", "password", "firstName", function (newUser) {
                user = newUser;
                done();
            });
        });
        after(function (done) {
            dbUtils.clearUserCollection(function () {
                dbUtils.clearQuestionCollection(done);
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
    describe("GET /questions?questionsPerPage,pageNumber,sortOrder,categoryId", function () {
        before(function (done) { //mostFavourited, mostViewed, mostRecent
            //create 50 test questions, with varying favourites, views, timecreated
            done();
        });
        it("should have correct default values");
        it("should have correct pagination");
        it("should sort correctly");
        it("should filter by categoryId");
    });
    describe("GET /questions/:id", function () {
        var question;
        var user;
        before(function (done) {
            dbUtils.createTestUser("email", "password", "firstName", function (createdUser) {
                user = createdUser;
                dbUtils.createTestQuestion("title", "text", user._id, 2, function (createdQuestion) {
                    question = createdQuestion;
                    done();
                });
            });
        });
        after(function (done) {
            dbUtils.clearQuestionCollection(function () {
                dbUtils.clearUserCollection(done);
            });
        });
        it("should return error if invalid id", function (done) {
            request(app).get('/api/questions/sdf').expect(400).end(function (err, res) {
                res.body.error.should.equal("Could not find question, please form your requests like the following: api/question/QUESTION_ID");
                done();
            });
        });
        it("should return question if valid id", function (done) {
            request(app).get('/api/questions/' + question._id).expect(200).end(function (err, res) {
                res.body.questionId.should.equal(String(question._id));
                res.body.name.should.equal(question.name);
                res.body.description.should.equal(question.text);
                res.body.askerName.should.equal(user.firstName);
                res.body.askerEmail.should.equal(user.email);
                res.body.category.should.equal(question.category);
                done();
            });
        });
    });
    describe("DELETE /questions", function () {
        var question;
        var user;
        before(function (done) {
            dbUtils.createTestUser("email", "password", "firstName", function (newUser) {
                user = newUser;
                dbUtils.createTestQuestion("title", "description", user._id, 1, function (doc) {
                    question = doc;
                    done();
                });
            });
        });
        after(function (done) {
            dbUtils.clearUserCollection(function () {
                dbUtils.clearQuestionCollection(done);
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
