/**
 * Created by Sahil Jain on 01/09/2014.
 */

process.env.NODE_ENV = 'test';

var request = require('supertest');
var should = require('should');
var app = require('../../server');
var Constants = require('../../constants');

describe('Other Endpoints', function () {
    describe('GET /categories', function () {
        it('should have 5 categories', function (done) {
            request(app).get('/api/categories').expect(200).end(function (err, res) {
                res.body.should.have.lengthOf(5);
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
                res.headers.location.should.equal(Constants.URLS.API_DOC);
                done();
            });
        });
    });
    describe('GET /blahblahblah', function () {
        it('should give error json', function (done) {
            request(app).get('/api/blahblahblah').expect(404).end(function (err, res) {
                console.log(res.body);
                res.body.error.should.equal(Constants.ERROR.INVALID.HTTP_METHOD);
                done();
            });
        });
    });
});
