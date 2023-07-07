// User.js

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var User = new Schema({
    firstName: {type: String},
    lastName: {type: String},
    mobile: {type: String},
    username: {type: String, unique: true },
    password: {type: String}
})

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User)