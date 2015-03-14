/**
 * Created by Sahil Jain on 02/09/2014.
 */
process.env.NODE_ENV = 'test';

var request = require('supertest');
var should = require('should');
var app = require('../../server');
var jwt = require('jwt-simple');
var Answer = require('../../models/answer');
var dbUtils = require('../../utils/databaseutils');
var Constants = require('../../constants');

describe('Answer Endpoints', function () {
    describe("POST /answers", function () {
        var question;
        var user;
        before(function (done) {
            Answer.remove({}, function(err) {
                dbUtils.createTestUser("email", "password", "firstName", function (newUser) {
                    user = newUser;
                    dbUtils.createQuestion("title", "description", user._id, 1, function (doc) {
                        question = doc;
                        done();
                    });
                });
            });
        });
        after(function (done) {
            dbUtils.clearUserCollection(function () {
                dbUtils.clearQuestionCollection(function() {
                    Answer.remove({}, done);
                });
            });
        });
        it("should not post if missing questionId", function (done) {
            request(app).post('/api/answers').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.QUESTION_ID);
                done();
            });
        });
        it("should not post if missing answerBody", function (done) {
            request(app).post('/api/answers').send({questionId: "someId"}).expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.ANSWER_BODY);
                done();
            });
        });
        it("should not post if missing token", function (done) {
            request(app).post('/api/answers').send({questionId: "someId", answerBody: "description"}).expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.TOKEN);
                done();
            });
        });
        it("should not post if invalid token", function (done) {
            request(app).post('/api/answers').send({questionId: "someId", answerBody: "description", token: "blahblahblah"}).expect(401).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.INVALID.TOKEN);
                done();
            });
        });
        it("should post answer if given valid info", function (done) {
            var token = jwt.encode({userId: user._id}, "testsecret");
            token.should.not.be.empty;
            request(app).post('/api/answers').send({questionId: question._id, answerBody: "description", token: token}).expect(200).end(function (err, res) {
                console.log(res.body);
                res.body.result.should.equal(Constants.SUCCESS.SAVE.ANSWER);
                Answer.find({}, function (err, docs) {
                    should.not.exist(err);
                    docs.length.should.equal(1);
                    done();
                });
            });
        });
    });
});