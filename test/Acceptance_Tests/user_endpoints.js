/**
 * Created by Sahil Jain on 02/09/2014.
 */

process.env.NODE_ENV = 'test';

var request = require('supertest');
var should = require('should');
var app = require('../../server');
var jwt = require('jwt-simple');
var User = require('../../models/user');
var dbUtils = require('../../utils/databaseutils');
var Constants = require('../../constants');

describe('User Endpoints', function () {

    describe('POST /signup', function () {
        before(function (done) {
            dbUtils.clearUserCollection(done);
        });
        it('should return error when no email provided', function (done) {
            request(app).post('/api/signup').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.EMAIL);
                done();
            });
        });
        it('should return error when no password provided', function (done) {
            request(app).post('/api/signup?email=hello').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.PASSWORD);
                done();
            });
        });
        it('should return error when no firstName provided', function (done) {
            request(app).post('/api/signup?email=hello&password=hello').expect(400).end(function (err, res) {
                res.body.error.should.equal(Constants.ERROR.MISSING.FIRST_NAME);
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
});
