const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require("bcrypt");

const User = require("./model/User");
const Venue = require("./model/Venue");
const Owner = require("./model/Owner");

const dbUrl ="mongodb+srv://shah:shah1234@shaheapi.mwxpczn.mongodb.net/?retryWrites=true&w=majority";

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(dbUrl, connectionParams).then(function(){
    console.log("db connected")
  });
}

const app = express();

app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
// require("./passport-setup.js");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

passport.use(
  new LocalStrategy(function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      bcrypt.compare(password, user.password, function(err, result) {
        if (err) { return done(err); }
        if (!result) { return done(null, false); }
        return done(null, user);
      });
    });
  })
);  

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("indexx");
});

app.get("/view", isLoggedIn, function (req, res) {
  res.render("view");
});

app.get("/view_owner", isLoggedIn, function (req, res) {
  res.render("view_owner");
});
app.get("/gallery", function (req, res) {
  res.render("gallery");
});

app.get("/users/:userName", async function (req, res) {
  let namee = req.params.userName;
  var name = namee.slice(3, namee.length);
  const user = await User.findOne({ username: name });
  res.render("user", { user: user });
});

function capitalize(str) {
  const str2 = str.charAt(0).toUpperCase() + str.slice(1);
  return str2;
}

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/contact", function (req, res) {
  res.render("contact");
});

app.get("/signup", function (req, res) {
  res.render("signup", { phrase: "Welcome" });
});

app.post("/signup", async (req, res) => {
  var email = req.body.email;
  const find = await User.findOne({ username: email });
  if (find) {
    return res.render("signup", { phrase: "Email already used" });
    // alert("Username already used");
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const user = await User.create({
      firstName: capitalize(req.body.fName),
      lastName: capitalize(req.body.lName),
      mobile: req.body.cNumber,
      username: req.body.email,
      password: hashedPassword,
    });

    Venue.find({})
      .then(function (data) {
        res.render("view", { user: user, record: data });
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/login", function (req, res) {
  res.render("login", { loginPhrase: "Welcome User" });
});

// const x = Venue.find({});
// app.post('/login', passport.authenticate('local', { successRedirect: '/view', failureRedirect: '/login'}))
app.post("/login", async function (req, res) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username });

    if (!user) {
      return res.render("login", { loginPhrase: "Password doesn't match" });
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Set cookie
      res.cookie('user', user._id, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

    const userfind = await User.findOne({ username: req.body.username });
    Venue.find({})
      .then(function (data) {
        // console.log(data);
        res.render("view", { user: userfind, record: data });
      })
      .catch(function (err) {
        console.log(err);
      });

    // res.send('Logged in successfully');
  } else {
    return res.render("login", { loginPhrase: "Password doesn't match" });
  }
} catch (err) {
  console.error(err);
  res.status(500).send('Internal server error');
}
});

var t = new Date();
var today = t.getDate() + "-" + (t.getMonth() + 1) + "-" + t.getFullYear();
console.log(today); 
// console.log("30-4-2023" > "30-5-2023")
Venue.find({}).then(async function (data) {
  data.forEach(function (element) {
    if (element.dateto !== "-") {
      // console.log(element.dateto > today);

      if (element.dateto < today) {
        Venue.findOne({ username: element.username }).then(function (that) {
          element
            .updateOne({ datefrom: "-", dateto: "-", isOccupied: "No" })
            .then(function () {});
          console.log(element);
        });
      }
    }
  });
});
// console.log(data.username);
// Venue.updateMany({ dateto: { $lt: currentDate } }, (err) => {
//   if (err) {
//     console.error(err);
//   } else {
//     console.log('Removed venues whose last date has passed.');
//   }
// });

app.get("/logout", function (req, res) {
  res.clearCookie("user");
  res.redirect("/");
  // res.send('Logged out successfully');
});

app.post("/success", function (req, res) {
  console.log(req.body.name);
});

app.get("/signup_owner", function (req, res) {
  res.render("signup_owner", { phrase: "Welcome" });
});

app.post("/update_owner", async function (req, res) {
  var users = req.body.owner;

  await Owner.findOne({ _id: users }).then(function (founduser) {
    founduser
      .updateOne({ name: req.body.fname, mNumber: req.body.number })
      .then(async function () {
        console.log(req.body.number);
        const thisuser = await Owner.findOne({ _id: users });
        Venue.find({}).then(function (data) {
          res.render("view_owner", { owner: thisuser, record: data });
        });
      });
  });
});

app.post("/update_user", async function (req, res) {
  var users = req.body.user;

  await User.findOne({ _id: users }).then(function (founduser) {
    founduser
      .updateOne({
        firstName: req.body.fname,
        lastName: req.body.lname,
        mobile: req.body.number,
      })
      .then(async function () {
        console.log(req.body.number);
        const thisuser = await User.findOne({ _id: users });
        await Venue.find({}).then(function (data) {
          res.render("view", { user: thisuser, record: data });
        });
      });
  });
});

app.post("/view", async function (req, res) {
  var s = new Date(req.body.start);
  var start = s.getDate() + "-" + (s.getMonth() + 1) + "-" + s.getFullYear();
  var e = new Date(req.body.end);
  var end = e.getDate() + "-" + (e.getMonth() + 1) + "-" + e.getFullYear();
  console.log(start);
  console.log(end);
  // console.log(req.body.start.getDate());
  Venue.findOne({ username: req.body.isSelect }).then(function (data) {
    data
      .updateOne({
        isOccupied: req.body.usernamee,
        datefrom: start,
        dateto: end,
      })
      .then(function () {
        console.log("updated");
      });
  });
  const user = await User.findOne({ username: req.body.usernamee });
  Venue.find({}).then(function (data) {
    res.render("view", { user: user, record: data });
  });
});

app.post("/deselect", async function (req, res) {
  await Venue.findOne({ username: req.body.isSelect }).then(function (data) {
    data
      .updateOne({ isOccupied: "No", dateto: "-", datefrom: "-" })
      .then(function () {
        console.log("updated");
      });
  });
  const user = await User.findOne({ username: req.body.usernamee });
  await Venue.find({}).then(function (data) {
    res.render("view", { user: user, record: data });
  });
});



app.get("/FAQ", function (req, res) {
  res.render("FAQ");
});

app.post("/delete_venue", async function (req, res) {
  const id = req.body.selectvenue;
  await Venue.deleteOne({ _id: id });

  const owner = await Owner.findOne({ _id: req.body.ownerdtl });
  Venue.find({})
    .then(function (data) {
      res.render("view_owner", { owner: owner, record: data });
    })
    .catch(function (err) {
      console.log(err);
    });
});
app.post("/update_venue", async function (req, res) {
  const venue_id = req.body.venuedtl;
  // console.log(req.body.venuedtl);
  const owner = await Owner.findOne({ _id: req.body.ownerdtl });
  await Venue.findOne({ _id: venue_id }).then(function (v) {
    v.updateOne({
      type: req.body.type,
      capacity: req.body.capacity,
      price: req.body.price,
    }).then(function () {
      console.log("updated");
    });
  });
  await Venue.find({})
    .then(function (data) {
      res.render("view_owner", { owner: owner, record: data });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/addVenue", async (req, res) => {
  const newVenue = await Venue.create({
    username: capitalize(req.body.place),
    cityName: capitalize(req.body.city),
    stateName: capitalize(req.body.state),
    type: capitalize(req.body.type),
    capacity: req.body.capacity,
    price: req.body.price,
    isOccupied: "No",
    owner: req.body.ownerdtl,
    dateto: "-",
    datefrom: "-",
  });
  // newVenue.save();

  const owner = await Owner.findOne({ username: req.body.ownerdtl });
  Venue.find({})
    .then(function (data) {
      res.render("view_owner", { owner: owner, record: data });
    })
    .catch(function (err) {
      console.log(err);
    });
  // res.send('please <a href="/login_owner">login</a> again to view changes');
});

app.post("/signup_owner", async (req, res) => {
  var email = req.body.oEmail;
  const find = await Owner.findOne({ username: email });
  // console.log(find);
  if (find) {
    return res.render("signup_owner", { phrase: "Email already used" });
    // alert("Username already used");
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const owner = await Owner.create({
      name: capitalize(req.body.oName),
      mNumber: req.body.oNumber,
      username: req.body.oEmail,
      password: hashedPassword,
    });

    Venue.find({})
      .then(function (data) {
        res.render("view_owner", { owner: owner, record: data });
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/login_owner", function (req, res) {
  res.render("login_owner", { loginPhrase: "Welcome Owner" });
});

app.post("/login_owner", async function (req, res) {
  try {
    // check if the user exists
    const { username, password } = req.body;
    const owner = await Owner.findOne({ username: username });
    //   console.log(owner);
    if (!owner) {
      return res.render("login_owner", { loginPhrase: "Password doesn't match" });
    }
    const passwordMatch = await bcrypt.compare(password, owner.password);

    if (passwordMatch) {
      // Set cookie
      res.cookie('user', owner._id, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

    const userfind = await Owner.findOne({ username: req.body.username });
    Venue.find({})
      .then(function (data) {
        // console.log(data);
        res.render("view_owner", { owner: userfind, record: data });
      })
      .catch(function (err) {
        console.log(err);
      });

    // res.send('Logged in successfully');
  } else {
    return res.render("login_owner", { loginPhrase: "Password doesn't match" });
  }
} catch (err) {
  console.error(err);
  res.status(500).send('Internal server error');
}
});

app.post("/view_owner", function (req, res) {
  res.render("addVenue", { ownerdtl: req.body.ownerdtl });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/");
    // res.send("Not Authenticated");    
    console.log("Not Authenticated");
  }
}

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});
