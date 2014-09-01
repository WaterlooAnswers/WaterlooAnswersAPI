/**
 * Created by Sahil Jain on 01/09/2014.
 */

process.env.NODE_ENV = 'test'

var assert = require("assert");
var request = require('supertest');
var should = require('should');
var app = require('../server');
var mongoose = require('mongoose');
var jwt = require('jwt-simple');

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
        before(function (done) {

        });
    });
});

function clearUserCollection(done) {
    mongoose.connection.collections.users.remove(function () {
        return done();
    });
}