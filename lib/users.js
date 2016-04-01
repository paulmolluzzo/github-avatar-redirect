import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Users = new Schema({
  username: String,
  avatar: String
});

module.exports = mongoose.model('User', Users);
