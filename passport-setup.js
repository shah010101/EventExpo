const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");
// end point=http://localhost:80/google/callback
const GOOGLE_CLIENT_ID ="662599435857-h6cjnirnq14ul07b6bmh17r7q77a5t0s.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "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";
passport.serializeUser(function (user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/google/callback",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
     console.log(profile);
        return done(null, profile);
    
    }
  )
);