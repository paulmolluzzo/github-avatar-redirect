import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import https from 'https';

const app = express();
app.engine('html', require('ejs').renderFile);

// view engine
app.set('view engine', 'html');
app.use('/assets', express.static('public'));

// connect to MongoDB
mongoose.connect(process.env.MONGO_DB_URL);

// Body parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// User Model
import User from './users';

// Creating User
function createUserWithAvatar(res, username) {
  const options = {
    host: 'api.github.com',
    path: '/users/' + username,
    headers: {'user-agent': 'Mozilla/5.0'}
  };
  const req = https.get(options, (response) => {
    let body = '';
    response.on('data', d => {
      body += d;
    });
    response.on('end', () => {
      const parsed = JSON.parse(body);

      // Create and save a new user
      const user = new User();
      user.username = username;
      user.avatar = parsed.avatar_url;

      user.save(err => {
        if (err) {
          res.send(err);
        }

        res.redirect(parsed.avatar_url);
      });
    });
  });

  req.on('error', err => {
    console.log(err);
    res.write('Something went wrong. Sorry.');
  });

  req.setTimeout(5000, () => {
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
router.use((req, res, next) => {
  console.log(res);
  next();
});

router.route('/').get((req, res) => {
  res.render('index', {homeURL: req.protocol + '://' + req.get('host')});
});

router.route('/:username').get((req, res) => {
  var requestedName = req.params.username;

  User.findOne({username: requestedName}, (err, user) => {
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
  app.use((err, req, res) => {
    res.status(err.status || 500);
    res.send('error', {
      message: err.message,
      error: err
    });
  });
}

app.use((err, req, res) => {
  res.status(err.status || 500);
  res.send('error', {
    message: 'Something went wrong. Sorry.'
  });
});

module.exports = app;
