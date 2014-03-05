var mongoose = require('mongoose');

module.exports = function(connection_string){
	
	mongoose.connect(connection_string);
	var db = mongoose.connection;
    db.on('error', function(){
            console.log("database could not open");
    });
	db.once('open', function callback () {
            console.log("database open");
	});


};