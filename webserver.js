const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');

//////////////////////////////// GPIO ////////////////////////////////

var io = require('socket.io', 'net')(http) //require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED6 = new Gpio(6, 'out'); //use GPIO pin 6 as output
var LED13 = new Gpio(13, 'out'); //use GPIO pin 13 as output
var LED22 = new Gpio(22, 'out'); //use GPIO pin 22 as output
var LED27 = new Gpio(27, 'out'); //use GPIO pin 27 as output

var GPIO6value = 0;  // Turn on the LED by default
var GPIO13value = 0;  // Turn on the LED by default
var GPIO22value = 0;  // Turn on the LED by default
var GPIO27value = 0;  // Turn on the LED by default

process.on('SIGINT', function () { //on ctrl+c
	LED6.writeSync(0); // Turn LED off
	LED6.unexport(); // Unexport LED GPIO to free resources
	LED13.writeSync(0); // Turn LED off
	LED13.unexport(); // Unexport LED GPIO to free resources
	LED22.writeSync(0); // Turn LED off
	LED22.unexport(); // Unexport LED GPIO to free resources
	LED27.writeSync(0); // Turn LED off
	LED27.unexport(); // Unexport LED GPIO to free resources
	process.exit(); //exit completely
});

/****** io.socket is the websocket connection to the client's browser********/

io.sockets.on('connection', function (socket) {// WebSocket Connection
	console.log('A new client has connectioned. Send LED status');
	socket.emit('GPIO6', GPIO6value);
	socket.emit('GPIO13', GPIO13value);
	socket.emit('GPIO22', GPIO22value);
	socket.emit('GPIO27', GPIO27value);

	// this gets called whenever client presses GPIO6 toggle light button
	socket.on('GPIO6T', function (data) {
		io.emit('GPIO6', GPIO6value); //send button status to ALL clients 
		if (GPIO6value) GPIO6value = 0;
		else GPIO6value = 1;
		console.log('GPIO6 value=' + GPIO6value);
		LED6.writeSync(GPIO6value); //turn LED on or off
	});

	// this gets called whenever client presses GPIO13 toggle light button
	socket.on('GPIO13T', function (data) {
		io.emit('GPIO13', GPIO13value); //send button status to ALL clients 
		if (GPIO13value) GPIO13value = 0;
		else GPIO13value = 1;
		console.log('GPIO13 value=' + GPIO13value);
		LED13.writeSync(GPIO13value); //turn LED on or off
	});

	// this gets called whenever client presses GPIO22 toggle light button
	socket.on('GPIO22T', function (data) {
		io.emit('GPIO22', GPIO22value); //send button status to ALL clients 	
		if (GPIO22value) GPIO22value = 0;
		else GPIO22value = 1;
		console.log('GPIO22 value=' + GPIO22value);
		LED22.writeSync(GPIO22value); //turn LED on or off
	});

	// this gets called whenever client presses GPIO27 toggle light button
	socket.on('GPIO27T', function (data) {
		io.emit('GPIO27', GPIO27value); //send button status to ALL clients
		if (GPIO27value) GPIO27value = 0;
		else GPIO27value = 1;
		console.log('GPIO27 value=' + GPIO27value);
		LED27.writeSync(GPIO27value); //turn LED on or off
	});

	//Whenever someone disconnects this piece of code executed
	socket.on('disconnect', function () {
		console.log('A user disconnected');
	});
});
//////////////////////////////// End GPIO ////////////////////////////////


const app = express();
app.use(express.urlencoded({ extended: false }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieSession ({
     name: 'session',
     keys: ['key1', 'key2'],
     maxAge: 3600 * 1000
}))

//Declaring Custom Middleware
const ifNotLoggedIn = (req, res, next) => {
     if (!req.session.isLoggedIn) {
          return res.render('login-register');
     }
     next();
}

const ifLoggedIn = (req, res, next) => {
     if (req.session.isLoggedIn) {
          // return res.render('/admin');
          return res.render('/');
     }
     next();
}


// root page
app.get('/', ifNotLoggedIn, (req, res, next) => {
     dbConnection.execute("SELECT * FROM users WHERE id = ?", [req.session.userID])
     .then(([rows]) => {
          if (rows[0].urole === 'admin') {
               res.render('admin', {
                    name: rows[0].name,
                    urole: rows[0].urole
               })
          } else {
               res.render('home', {
                    name: rows[0].name,
                    urole: rows[0].urole
               })
          }
          
     })
})

// Register Page
app.post('/register', ifLoggedIn, [
     body('user_email', 'Invalid Email Address!').isEmail().custom((value) => {
          return dbConnection.execute('SELECT email FROM users WHERE email = ?', [value])
          .then(([rows]) => {
               if (rows.length > 0) {
                    return Promise.reject('This email already in use');
               }
               return true;
          })
     }),
     body('user_name', 'Username is empty').trim().not().isEmpty(),
     body('user_pass', 'This password must be of minimum length 6 charector').trim().isLength({ min: 6 }),
],
     (req, res, next) => {
          const validation_result = validationResult(req);
          const { user_name, user_pass, user_email } = req.body;

          if (validation_result.isEmpty()) {
               bcrypt.hash(user_pass, 12).then((hash_pass) => {
                    dbConnection.execute("INSERT INTO users (name, email, password, urole) VALUES (?, ?, ?, 'user')", 
                    [user_name, user_email, hash_pass])
                    .then(result => {
                         res.send(`Your account has been successfully, Now you can <h2><a href="/">Login</a></h2>`);
                    }).catch(err => {
                         if (err) throw err;
                    })
               }).catch(err => {
                    if (err) throw err;
               })
          } else {
               let allErrors = validation_result.errors.map((error) => {
                    return error.msg;
               })

               res.render('login-register', {
                    register_error: allErrors,
                    old_data: req.body
               })
          }
     })

//Login Page
app.post('/', ifLoggedIn, [
     body('user_email').custom((value) => {
          return dbConnection.execute('SELECT email FROM users WHERE email =?', [value])
          .then(([rows]) => {
               if (rows.length == 1) {
                    return true;
               }
               return Promise.reject('Invalid Email Address');
          });
     }),
     body('user_pass', 'Password is empty').trim().not().isEmpty(),
],(req, res) => {
     const validation_result = validationResult(req);
     const { user_pass, user_email } = req.body;
     if (validation_result.isEmpty()) {
          dbConnection.execute("SELECT * FROM users WHERE email = ?", [user_email])
          .then(([rows]) => {
               bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                    if (compare_result === true) {
                         req.session.isLoggedIn = true;
                         req.session.userID = rows[0].id;
                         res.redirect('/');
                    } else {
                         res.render('login-register', {
                              login_errors: ['Invalid Password']
                         })
                    }
               }).catch(err => {
                    if (err) throw err;
               })
          }).catch(err => {
               if (err) throw err;
          })
     } else {
          let allErrors = validation_result.errors.map((error) => {
               return error.msg;
          })

          res.render('login-register', {
               login_errors: allErrors
          })
     }
})

// Logout
app.get('/logout', (req, res) => {
     req.session = null;
     res.redirect('/');
})

app.use('/', (req, res) => {
     res.status(404).send('<h2>404 page not found</h2>')
})

app.listen(3000, function() {
     console.log('Server is running...');
     // LED6.writeSync(GPIO6value); //turn LED on or off
	// LED13.writeSync(GPIO13value); //turn LED on or off
	// LED22.writeSync(GPIO22value); //turn LED on or off
	// LED27.writeSync(GPIO27value); //turn LED on or off
	// console.log('Server running on Port ' + WebPort);
	// console.log('GPIO6 = ' + GPIO6value);
	// console.log('GPIO13 = ' + GPIO13value);
	// console.log('GPIO22 = ' + GPIO22value);
	// console.log('GPIO27 = ' + GPIO27value);

})