/**
 * Created by Sahil Jain on 02/09/2014.
 */

process.env.NODE_ENV = 'test';

var request = require('supertest');
var should = require('should');
var app = require('../../server');
var jwt = require('jwt-simple');
var User = require('../../models/user');
var dbUtils = require('../test_db_utils');

describe('User Endpoints', function () {

    describe('POST /signup', function () {
        before(function (done) {
            dbUtils.clearUserCollection(done);
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

    describe('GET /profile', function () {
        it("should return correct data about user");
    });
});
