// Load required packages
var mongoose = require('mongoose');

// Define our task schema
var ClassSchema = mongoose.Schema({
	id: String,
	identifier: String,
	department_id: String,
	name: String,
	credit: String,
	description: String,
	users: [String]
});

// Export the Mongoose model
module.exports = mongoose.model('Class', ClassSchema);