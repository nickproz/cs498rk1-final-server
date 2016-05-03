// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();

var User = require('./models/user');
var Class = require('./models/class');

// Connect to our MLab database
mongoose.connect('mongodb://nickproz:bearsrock@ds033897.mlab.com:33897/cs498rk1-final');
var db = mongoose.connection;

// Create our Express application
var app = express();

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

//Allow CORS so that backend and frontend can be put on different servers
var allowCrossDomain = function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  
	// Intercept OPTIONS method
	if ('OPTIONS' == req.method) {
	  res.sendStatus(200);
	}
	else {
	  next();
	}
};

app.use(allowCrossDomain);

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
  extended: true
}));  

app.use(bodyParser.json());

// Allow req to access our database
app.use(function(req,res,next){
    req.db = db;
    next();
});

// All our routes will start with /api
app.use('/api', router);

// Default route
var homeRoute = router.route('/');

// Hello World!
homeRoute.get(function(req, res) {
  res.json({ message: 'Hello World!' });
});

// CREATE A NEW USER
var usersRoute = router.route('/users');

usersRoute.post(function(req, res) {
	
	var user = new User(); 
	var data = req.body; 
	
	// Initialize variables based on data passed in
	user.firstName = data.firstName;
	user.lastName = data.lastName;
	user.userName = data.userName;
	user.email = data.email;
	user.password = data.password;
	user.classes = [];
	user.dateCreated = new Date();
	
	// Server validation for name and email, send error if either field is blank
	if(user.firstName === "undefined" || user.lastName === "undefined" || user.userName === "undefined" || user.email === "undefined" || user.password ==="undefined" || user.firstName === undefined || user.lastName === undefined || user.userName === undefined || user.email === undefined || user.password === undefined) {
		return res.status(500).send({ 'message': 'Please fill out all fields with valid characters.', 'data': [] });
	}	
	
	// Try to find a user with specified email, if there is no user with specified email, save user to database
	User.findOne({ 'email': user.email }, function (err, person) {
		if (err) {
			return res.status(500).send({ 'message': 'Please fill out all fields with valid characters.', 'data': [] });
		}
		if (person === null) {
			user.save(function(err) {
				if (err)
					return res.status(500).send({ 'message': 'Failed to save user to the database.', 'data': [] });
				else
					return res.status(201).send({ 'message': 'User successfully created!', 'data': user });
			});
		}
		else 
			return res.status(500).send({ 'message': 'The email provided is already in use!', 'data': []});
	}); 
});

// GET ALL USERS
usersRoute.get(function(req, res) {
	
	// Get all query parameters
	var where = eval("("+req.query.where+")");
	var sort = eval("("+req.query.sort+")");
	var select = eval("("+req.query.select+")");
	var skip = eval("("+req.query.skip+")");
	var limit = eval("("+req.query.limit+")");
	var count = eval("("+req.query.count+")");
	
	// Return count of users that would be returned that meet the specified criteria
	if(count === true) {
		User.count(where, function(err, list) {
			if (err) 
				return res.status(500).send({'message': 'Failed to retrieve users.', 'data': []});
			else
				return res.status(200).send({'message': "OK", 'data': list});
		}).limit(limit).skip(skip).sort(sort);
	}
	// Return all users that meet the specified criteria
	else {
		User.find(where, select, function(err, list) {
			if (err) 
				return res.status(500).send({'message': 'Failed to retrieve users.', 'data': []});
			else
				return res.status(200).send({'message': "OK", 'data': list});
		}).limit(limit).skip(skip).sort(sort);
	}
});

var userDetailsRoute = router.route('/users/:id');

// GET A SINGLE USER
userDetailsRoute.get(function(req, res) {
	
	var id = req.params.id;
	
	// Find user based on specified id, return 404 or user found
	User.findOne({'_id': id }, function(err, person) {
		if (err || person === null) 
			return res.status(404).send({'message': 'User not found.', 'data': []});
		else
			return res.status(200).send({'message': "OK", 'data': person});
	});
});


// UPDATE A USER
userDetailsRoute.put(function(req, res) {
	
	var id = req.params.id;
	var user = req.body;
	
	if(user.firstName === "undefined" || user.lastName === "undefined" || user.userName === "undefined" || user.email === "undefined" || user.password === "undefined" || user.firstName === undefined || user.lastName === undefined || user.userName === undefined || user.email === undefined || user.password === undefined) {
		return res.status(500).send({ 'message': 'Please fill out all fields with valid characters.', 'data': [] });
	}	

	User.update(
		{ '_id': id },
		{ $set: {"firstName": user.firstName, "lastName": user.lastName, "userName": user.userName, "email": user.email, "password": user.password} }, 
		function(err, person) {
			if(err)
				return res.status(400).send({ 'message': 'User not found.', 'data': [] });
			else {
				User.findOne({'_id': id }, function(err, person) {
					if (err || person === null) 
						return res.status(404).send({'message': 'User not found.', 'data': []});
					else
						return res.status(200).send({'message': "User succesfully updated!", 'data': person});
				});
			}
		}
	);
});

// REMOVE A USER
userDetailsRoute.delete(function(req, res) {
	
	var id = req.params.id;
	
	// Find user based on specified id, return 404 or remove user from database
	User.findOne({'_id': id }, function(err, person) {
		if (err || person === null) 
			return res.status(404).send({'message': 'User not found.', 'data': []});
		else {
			var tasks = person.pendingTasks;
			User.remove({ '_id' : id }, function(err) {
				if(err)
					return res.status(404).send({'message': 'User not found.', 'data': []});
				else
					return res.status(200).send({'message': 'User successfully deleted.', 'data': []});
			});
		}
	});
});

// CREATE A NEW CLASS
var classesRoute = router.route('/classes');

classesRoute.post(function(req, res) {
	
	var newClass = new Class(); 
	var data = req.body; 
	
	// Initialize variables based on data passed in
	newClass.id = data.id;
	newClass.identifier = data.identifier;
	newClass.department_id = data.department_id;
	newClass.name = data.name;
	newClass.credit = data.credit;
	newClass.description = data.description;
	newClass.users = [];
	newClass.dateCreated = new Date();
	
	// Try to find a user with specified email, if there is no user with specified email, save user to database
	Class.findOne({ 'id': newClass.id }, function (err, oldClass) {
		if (err) {
			return res.status(500).send({ 'message': 'Failed to save class to the database.', 'data': [] });
		}
		if (oldClass === null) {
			newClass.save(function(err) {
				if (err)
					return res.status(500).send({ 'message': 'Failed to save class to the database.', 'data': [] });
				else
					return res.status(201).send({ 'message': 'Class successfully created!', 'data': newClass });
			});
		}
		else 
			return res.status(500).send({ 'message': 'The class provided is already in the database!', 'data': []});
	}); 
});

// GET ALL CLASSES
classesRoute.get(function(req, res) {
	
	// Get all query parameters
	var where = eval("("+req.query.where+")");
	var sort = eval("("+req.query.sort+")");
	var select = eval("("+req.query.select+")");
	var skip = eval("("+req.query.skip+")");
	var limit = eval("("+req.query.limit+")");
	var count = eval("("+req.query.count+")");
	
	// Return count of users that would be returned that meet the specified criteria
	if(count === true) {
		Class.count(where, function(err, list) {
			if (err) 
				return res.status(500).send({'message': 'Failed to retrieve classes.', 'data': []});
			else
				return res.status(200).send({'message': "OK", 'data': list});
		}).limit(limit).skip(skip).sort(sort);
	}
	// Return all users that meet the specified criteria
	else {
		Class.find(where, select, function(err, list) {
			if (err) 
				return res.status(500).send({'message': 'Failed to retrieve classes.', 'data': []});
			else
				return res.status(200).send({'message': "OK", 'data': list});
		}).limit(limit).skip(skip).sort(sort);
	}
});

var classDetailsRoute = router.route('/classes/:id');

// GET A SINGLE CLASS
classDetailsRoute.get(function(req, res) {
	
	var id = req.params.id;
	
	// Find user based on specified id, return 404 or user found
	Class.findOne({'id': id }, function(err, person) {
		if (err || person === null) 
			return res.status(404).send({'message': 'Class not found.', 'data': []});
		else
			return res.status(200).send({'message': "OK", 'data': person});
	});
});

// UPDATE A CLASS
classDetailsRoute.put(function(req, res) {
	
	var id = req.params.id;
	var data = req.body;

	Class.update(
		{ 'id': id },
		{ $set: {"id": data.id, "department_id": data.department_id, "name": data.name, "credit": data.credit, "description": data.description, "users": data.users} }, 
		function(err, updatedClass) {
			if(err)
				return res.status(400).send({ 'message': 'Class not found.', 'data':[] });
			else
				return res.status(200).send({'message': "Class succesfully updated!", 'data': data});
		}
	);
});

// REMOVE A CLASS
classDetailsRoute.delete(function(req, res) {
	
	var id = req.params.id;
	
	// Find user based on specified id, return 404 or remove user from database
	Class.findOne({'id': id }, function(err, newClass) {
		if (err || newClass === null) 
			return res.status(404).send({'message': 'Class not found.', 'data': []});
		else {
			Class.remove({ 'id' : id }, function(err) {
				if(err)
					return res.status(404).send({'message': 'Class not found.', 'data': []});
				else
					return res.status(200).send({'message': 'Class successfully deleted.', 'data': []});
			});
		}
	}); 
});



// Start the server
app.listen(port);
console.log('Server running on port ' + port);