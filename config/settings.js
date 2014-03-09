//var mongoose = require('mongoose');

exports.init = function(){

	exports.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
    exports.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
    if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
	    exports.connection_string = 'mongodb://admin:hUQubExw-mK_@127.10.3.2:27017/sj';
    }else{
        exports.connection_string = "mongodb://localhost/mfnadb";
    }
    if (typeof exports.ipaddress === "undefined"){
        //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
        //  allows us to run/test the app locally.
        console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
        exports.ipaddress = "127.0.0.1";
    }
};