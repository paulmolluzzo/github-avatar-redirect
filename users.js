var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Users = new Schema({
  username: String,
  avatar: String
});

module.exports = mongoose.model('User', Users);
