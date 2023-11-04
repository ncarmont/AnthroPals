const express = require('express');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// // Passport config
// passport.use(new GoogleStrategy({
//   clientID: GOOGLE_CLIENT_ID,
//   clientSecret: GOOGLE_CLIENT_SECRET,
//   callbackURL: "/auth/google/callback"
// }, (accessToken, refreshToken, profile, done) => {
//   // handle authentication here
//   // associate user with a session
//   return done(null, profile);
// }));

// app.get('/auth/google', 
//   passport.authenticate('google', { scope: ['profile', 'email'] }));

// app.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   (req, res) => {
//     // Successful authentication, redirect home.
//     res.redirect('/');
//   });

// Serve homepage
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        <a href="/auth/google">Log in with Google</a>
      </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});