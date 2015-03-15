/**
 * Created by Sahil Jain on 01/09/2014.
 */

process.env.NODE_ENV = 'test';

var should = require('should');
var tokenUtils = require('../../utils/tokenutils');
var jwt = require("jwt-simple");
var User = require("../../models/user");
var _ = require("lodash");


describe('lodash', function () {
    describe('.isEmpty()', function () {
        it('should be true if empty string is passed', function () {
            _.isEmpty("").should.be.true;
        });
        it('should be true if null is passed', function () {
            _.isEmpty(null).should.be.true;
        });
        it('should be false if a string is passed', function () {
            _.isEmpty("a").should.be.false;
        });
    })
});

describe('tokenutils', function () {
    describe('generateTokenFromUser', function () {
        it('should encode user id in token', function() {
            var user = new User({firstName: "John", email: "john@uwaterloo.ca", password: "password"});
            var token = tokenUtils.generateTokenFromUser(user);
            var claims = jwt.decode(token, "testsecret");
            should.equal(claims.userId, user._id);
        });
    });
    describe('getUserFromToken', function () {
        it('should find user from db', function (done) {
            var user = new User({firstName: "John", email: "john@uwaterloo.ca", password: "password"});
            user.save(function (err, user) {
                var token = jwt.encode({userId: user._id}, "testsecret");
                tokenUtils.getUserFromToken(token, function (err, userFromToken) {
                    should.equal(user.firstName, userFromToken.firstName);
                    should.equal(user.email, userFromToken.email);
                    should.equal(user.password, userFromToken.password);
                    should.ok(user._id.equals(userFromToken._id));
                    User.remove({}, done);
                });
            });
        });
    });
});