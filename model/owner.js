// Owner.js

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var Owner = new Schema({ 
    name: {type: String},
    mNumber: {type: String},
    username: {type: String, unique: true},
    password: {type: String}
})

Owner.plugin(passportLocalMongoose);

module.exports = mongoose.model('Owner', Owner)