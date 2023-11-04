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
    <title>AnthroPals</title>
    
    <!-- Use a nice font -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  
    <!-- Include a CSS framework like Bootstrap -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
    
    <!-- Custom CSS -->
    <style>
      body {
        font-family: 'Poppins', sans-serif;
        background-color: #f1f1f1; 
      }
      
      .container {
        max-width: 500px;
        margin-top: 50px;
        background-color: #fff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
      }
      
      h1 {
        font-size: 32px;
        text-align: center; 
      }
      
      .btn-google {
        background-color: #dd4b39;
        color: #fff;
        border: none;
      }
      
      .btn-google img {
        width: 20px;
        margin-right: 10px;
      }
    </style>
  
  </head>
  
  <body>
      <div class="container">
      
        <h1>AnthroPals</h1>
        
        <h2 class="text-center">Increasing the world's face time</h2>
        
        <p class="text-center">
          AnthroPals pre-fills your social calendar with relevant events for you during the week.
        </p>
  
      <button class="btn btn-block btn-google">
        <img src="google-logo.png"> Log in with Google
      </button>
  
    </div>
  
  </body>
  
  </html>
  `);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});