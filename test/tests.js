/**
 * Created by Sahil Jain on 01/09/2014.
 */
var request = require('supertest');
var should = require('should');
var textUtils = require('../utils/textutils');

describe('textutils', function () {
    describe('.isEmpty()', function () {
        it('should be true if empty string is passed', function () {
            textUtils.isEmpty("").should.be.true;
        });
        it('should be true if null is passed', function () {
            textUtils.isEmpty().should.be.true;
        });
        it('should be false if a string is passed', function () {
            textUtils.isEmpty("a").should.be.false;
        });
    })
});