var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var https = require('https');

// connect to MongoDB
mongoose.connect(process.env.MONGO_DB_URL);

// Body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// User Model
var User = require('./users');

// Creating User

function createUserWithAvatar(res, username) {
  var options = {
    host: 'api.github.com',
    path: '/users/' + username,
    headers: {'user-agent': 'Mozilla/5.0'}
  };
  var req = https.get(options, function (response) {
    var body = '';
    response.on('data', function (d) {
      body += d;
    });
    response.on('end', function () {
      var parsed = JSON.parse(body);

      // Create and save a new user
      var user = new User();
      user.username = username;
      user.avatar = parsed.avatar_url;

      user.save(function (err) {
        if (err) {
          res.send(err);
        }

        res.redirect(parsed.avatar_url);
      });
    });
  });

  req.on('error', function (err) {
    console.log(err);
    res.write('Something went wrong. Sorry.');
  });

  req.setTimeout(5000, function () {
    req.abort();
    console.log('timeout');
    req.emit('error', 'Timed out.');
  });

  req.end();
  return req;
}

// Routing
var router = express.Router();

// log requests
router.use(function (req, res, next) {
  console.log(res);
  next();
});

router.route('/').get(function (req, res) {
  res.send('Try going to: ' + req.get('host') + '/paulmolluzzo');
});

router.route('/:username').get(function (req, res) {
  var requestedName = req.params.username;

  User.findOne({username: requestedName}, function (err, user) {
    if (err) {
      res.send('Something went wrong. Sorry.');
    }

    if (user) {
      res.redirect(user.avatar);
      return;
    }

    createUserWithAvatar(res, requestedName);
  });
});

app.use('/', router);

if (app.get('env') === 'development') {
  app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.send('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function (err, req, res) {
  res.status(err.status || 500);
  res.send('error', {
    message: 'Something went wrong. Sorry.'
  });
});

module.exports = app;
