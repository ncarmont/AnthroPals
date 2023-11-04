const express = require('express');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const accountSid = 'AC27655ac42ecf740b31e84da34a6c442d';
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require('twilio')(accountSid, authToken);

// Passport config
// passport.use(new GoogleStrategy({
//   scope: ['profile', 'email', 'calendar'],
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: "/auth/google/callback"
// }, (accessToken, refreshToken, profile, done) => {
//   // handle authentication here
//   // associate user with a session
//   return done(null, profile);
// }));
const { auth } = require('express-openid-connect');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://localhost:3000',
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: 'https://ncarmont.eu.auth0.com'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/auth', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// app.get('/auth/google', 
//   passport.authenticate('google', { scope: ['profile', 'email', 'calendar'] }));

// app.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   (req, res) => {
//     // Successful authentication, redirect home.
//     res.redirect('/');
//   });

app.get('/message', (req, res) => {
  try {
    client.messages
    .create({
        body: 'Hi there from AnthroPals! 👋 Please tell me more about which type of event you want me to sign you up for.',
        to: '+44'+req.query.phone,
        from: '+447862144615'
    })
    .then(message => console.log(message.sid)).done();

    // from: 'whatsapp:+14155238886',
    // to: 'whatsapp:+44'+req.query.phone
  } catch (error) {
    
  }
 

    res.send('Message sent');
})

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

    form {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
    }
    
    label {
      color: #dd4b39; 
      font-size: 1.2em;
      margin-bottom: 10px; 
    }
    
    input[type="tel"] {
      width: 100%;
      padding: 12px 20px;
      box-sizing: border-box;
      border: grey 0.5px solid;
      margin: 20px 0px;
      border-radius: 4px;
      font-size: 1em;
    }
    
    input:focus {
      outline: 2px solid #dd4b39;
    }
    
    button {
      padding: 12px 30px;
      font-size: 1em; 
      background-color: #dd4b39;
      color: white;
      border: grey 0.5px solid;
      border-radius: 4px;
      cursor: pointer; 
    }
    
    button:hover {
      background-color: #c13929;
    }

    footer {
        margin-top: 50px;
        text-align: center;
    }
    
    footer a {
        color: #aaa; 
    }
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

    <form >
        <label for="phone">Phone Number:</label>
        
        <input type="tel" id="phone" name="phone" required pattern="[0-9]{10}">
        
        <button type="submit">Submit</button>
    </form>
  
      <button id="btn-google" class="btn btn-block btn-google">
        <img src="google-logo.png"> Log in with Google
      </button>
  
    </div>
  
  </body>
  <footer>
  <p>
    <a href="/privacy">Privacy Policy</a> |  
    <a href="/termsOfService">Terms of Service</a>
  </p>
</footer>
  <script>
  const googleBtn = document.getElementById('btn-google');

  googleBtn.addEventListener('click', () => {
  window.location = '/login'; 
  });

  const form = document.querySelector('form');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const phone = form.phone.value;

  window.location.href = "/message?phone="+phone;
});
  </script>
  
  </html>
  `);
});


app.get('/privacy', (req, res) => {
    res.send(`
    <h1>Privacy Policy</h1>

    <p>
      This privacy policy outlines how we collect, use, and protect your personal data.
    </p>
    
    <h2>Information We Collect</h2>
    
    <p>
      We only collect personal data that you voluntarily provide to us via this website. This may include:
    </p>
    
    <ul>
      <li>Name</li>
      <li>Email address</li>
      <li>Phone number</li>
      <li>Any other personal data you choose to provide</li>
    </ul>
    
    <h2>How We Use Information</h2>
    
    <p>
      We use your personal data for the following purposes:
    </p>
    
    <ul>
      <li>To provide and maintain our services</li>
      <li>To notify you about changes to our services</li>
      <li>To allow you to participate in interactive features when choosing to do so</li>
    </ul>
    
    <h2>Data Protection and Security</h2>
    
    <p>
      We implement security safeguards designed to protect your data, such as HTTPS. We regularly monitor our systems for possible vulnerabilities and attacks. However, we cannot warrant full security.
    </p>
    
    <p>
      We will not share your personal data with any third parties without your consent, except to comply with applicable laws.
    </p>
    
    <h2>Changes to this Policy</h2>
    
    <p>
      We may modify this privacy policy at any time. We encourage you to periodically review this page for the latest information.
    </p>
    
    <p>
      If you have any questions about this privacy policy, please contact us at privacy@example.com.
    </p>
    `)
  });


  app.get('/termsOfService', (req, res) => {
    res.send(` <h1>Terms of Service</h1>

<p>Last Updated: [DATE]</p>

<h2>Introduction</h2>

<p>
  These Terms of Service ("Terms") govern your use of [WEBSITE] and any related products and services (collectively, "Services").
</p>

<h2>Account Terms</h2>

<p>
  You must be at least 13 years old to create an account. You are responsible for maintaining account security and logging out. We may suspend accounts that violate Terms.
</p>

<h2>Service Use</h2>

<p>
  You may use our Services only as permitted by law. Unauthorized use may result in criminal and civil liability.
</p>

<h2>User Content</h2>

<p>
  You retain ownership of content you post on our Services. You grant us a non-exclusive license to use that content. You are responsible for content you post and compliance with laws.
</p>

<h2>Violations</h2> 

<p>
  We may investigate violations and disclose information to law enforcement. We may terminate your account and restrict your ability to use certain services.
</p>

<h2>Disclaimers</h2>

<p>
  Services are provided "as is" without warranties of any kind. We disclaim all statutory warranties including formerchantability, fitness for a particular purpose, accuracy and non-infringement.
</p>

<h2>Limitation of Liability</h2>

<p>
  We are not liable for any damages arising from use of our services. This includes direct, indirect, incidental, punitive and consequential damages.
</p>

<h2>Changes</h2>

<p>
  We may modify Terms at any time. If you use the Services after changes, you accept the updated Terms. 
</p>

<h2>Contact Us</h2>

<p>
  Please contact us if you have any questions about these Terms.
</p>
`)})
  
app.listen(process.env.PORT || 3000, () => {
  console.log('Server listening on port');
});