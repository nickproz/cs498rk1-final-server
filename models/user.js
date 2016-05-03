// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var UserSchema = mongoose.Schema({
	firstName: String,
	lastName: String,
	userName: String,
	email: String,
	password: String,
	classes: [String],
	dateCreated: Date
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
