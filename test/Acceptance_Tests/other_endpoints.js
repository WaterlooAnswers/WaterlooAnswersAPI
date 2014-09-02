/**
 * Created by Sahil Jain on 01/09/2014.
 */

process.env.NODE_ENV = 'test';

var request = require('supertest');
var should = require('should');
var app = require('../../server');

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
