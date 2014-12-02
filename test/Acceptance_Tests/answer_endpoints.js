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

describe('Answer Endpoints', function () {
    describe('POST /answers?', function () {
        it("should not post if missing parameters");
    });
});