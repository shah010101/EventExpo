// Venue.js

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');

var Venue = new Schema ({
    username: {type: String},
    cityName: {type: String},
    stateName: {type: String},
    type: {type: String},
    capacity: {type: Number},
    price: {type: Number},
    isOccupied: {type: String},
    owner: {type: String},
    datefrom: {type: String},
    dateto: {type: String}
});

Venue.plugin(passportLocalMongoose);

module.exports = mongoose.model('Venue', Venue)