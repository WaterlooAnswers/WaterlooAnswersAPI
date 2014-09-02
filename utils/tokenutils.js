/**
 * Created by Sahil Jain on 01/09/2014.
 */

var jwt = require("jwt-simple");
var User = require("../models/user");
var secret;
if (process.env.NODE_ENV == 'test') {
    secret = "testsecret";
} else {
    secret = "mysecret";
}

exports.generateTokenFromUser = function (user) {
    return jwt.encode({userId: user._id}, secret);
};

exports.getUserFromToken = function (token, next) {
    var claims;
    try {
        claims = jwt.decode(token, secret);
    } catch (ex) {
        return next(true, null);
    }
    User.findById(claims.userId, function (err, doc) {
        if (err) {
        }
        return next(err, doc);
    });
};