/**
 * Created by Sahil Jain on 01/09/2014.
 */
var assert = require("assert");
var request = require('supertest');
var should = require('should');
describe('GET /api', function () {
    describe('/categories', function () {
        it('should have 13 categories', function (done) {
            request("http://localhost:8080/api").get('/categories').expect(200).end(function (err, res) {
                res.body.should.have.lengthOf(13);
                done();
            });
        })
    });
    describe('/', function () {
        it('should redirect to docs', function (done) {
            request("http://localhost:8080/api").get('/').expect(200).end(function (err, res) {
                res.headers.location.should.equal("http://docs.waterlooanswers.apiary.io/");
                done();
            });
        });
    });
    describe('/blahblahblah', function () {
        it('should redirect to docs', function (done) {
            request("http://localhost:8080/api").get('/blahblahblah').expect(404).end(function (err, res) {
                res.body.error.should.equal("Invalid HTTP method or path, please refer to the API Documentation.");
                done();
            });
        });
    });
});