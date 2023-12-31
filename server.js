const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const eventsJson = require('./all_events.json');
const bodyParser = require('body-parser');
const app = express();
const accountSid = 'AC27655ac42ecf740b31e84da34a6c442d';
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require('twilio')(accountSid, authToken);
const { MessagingResponse } = require('twilio').twiml;
const Anthropic = require('@anthropic-ai/sdk');

app.use(bodyParser.urlencoded({ extended: false }));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Passport session setup
// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser((obj, done) => {
//   done(null, obj);
// });

// Use the GoogleStrategy within Passport
// passport.use(new GoogleStrategy({
//     clientID: GOOGLE_CLIENT_ID,
//     clientSecret: GOOGLE_CLIENT_SECRET,
//     callbackURL: "https://www.anthropals.social/auth/google/callback"
//   },
//   (accessToken, refreshToken, profile, done) => {
//     return done(null, profile);
//   }
// ));

// Configure Express
// app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
// app.use(passport.initialize());
// app.use(passport.session());

// GET /auth/google
// // Use passport.authenticate() as route middleware to authenticate the request
// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/calendar', 'profile', 'email'] })
// );

// GET /auth/google/callback
// // Use passport.authenticate() as route middleware to authenticate the request
// app.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/' }),
//   (req, res) => {
//     // Successful authentication, redirect home
//     res.redirect('/');
//   }
// );

// Access the Google Calendar API
// app.get('/calendar', (req, res) => {
//   if (!req.user) {
//     res.status(401).send('You need to sign in with Google');
//     return;
//   }

//   const oauth2Client = new google.auth.OAuth2(
//     GOOGLE_CLIENT_ID,
//     GOOGLE_CLIENT_SECRET,
//     'https://www.anthropals.social/auth/google/callback'
//   );

//   oauth2Client.setCredentials({
//     access_token: req.user.accessToken
//   });

//   const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  
//   calendar.events.list({
//     calendarId: 'primary',
//     timeMin: (new Date()).toISOString(),
//     maxResults: 10,
//     singleEvents: true,
//     orderBy: 'startTime',
//   }, (err, result) => {
//     if (err) {
//       res.status(500).send('Error retrieving calendar events');
//       console.error('The API returned an error: ' + err);
//       return;
//     }
//     const events = result.data.items;
//     res.status(200).json(events);
//   });
// });

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main(lastMessageBody) {
  try{
    const userQuestion = `
    Given these events ${JSON.stringify(eventsImpr)} 
    
    I have the following user preference for events: ${lastMessageBody}.
    What 3 events should I go to (including date, time and the valid event link from the events I sent you) within the next week given today is ${new Date().toISOString()}?
    
    If there are no relevant events in the designated timeframe, please respond with "No events".
    Be as concise as possible and give your response only in the following bullet points format: (e.g "📆 <event summary> from <start_time>-<end_time> on <date> (<url>, cost:<cost>)"). 
  
    
  
    For example for this event:
  
    <event url=https://aifringe.org/events/>{"title": "Expanding the conversation: AI for everyone", "event_description": "Day one at the AI Fringe Hub will set the scene for the week\u2019s conversations, exploring the benefits and risks of AI, its impact on underrepresented communities, research across the devolved nations, and more.", "demographics": "Anyone interested in AI", "keywords": ["AI", "ethics", "safety", "policy"], "time_start": "2023-10-30T00:00:00", "time_end": "2023-10-30T23:59:59", "location": "Knowledge Centre at The British Library", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": 100}</event>
  
    We want the following response: 
  
    📆 Expanding the conversation AI Event from 12am to 12pm on 2023-10-30 (https://aifringe.org/events/, Cost: Free )
  
    Only return the exact valid URL from the input given. Don't give any explanation text, only the concise event bullet points.  If Cost = 0, give "Free". Don't give any <event> tags. If they preference is "AI" give back the Anthropic hackathon event as the first of the events.
    
  `
  // 'claude-instant-1', 'claude-2', 
    const completion = await anthropic.completions.create({
      model: 'claude-instant-1', 
      max_tokens_to_sample: 300,
      prompt: `\n\nHuman: ${userQuestion}\n\nAssistant:`,
    });
    console.log(completion.completion);
    return completion.completion
  } catch(e){
    throw new Error(e)
  }
  
}
  

app.post('/sms', async (req, res) => {

  try {
    const twiml = new MessagingResponse();
    const lastMessageBody = req.body.Body; // The text body of the last incoming message
    console.log(`Last incoming message: ${lastMessageBody}`);
  
    const resp = await main(lastMessageBody)
  
    let mes = `Good news 😎 I found some relevant events for you this week: 
    
    `+ resp 
  
    twiml.message(mes.replace(/\\n/g, '\n'))
    return res.type('text/xml').send(twiml.toString());
  } catch (error) {
    return res.send(e)
  }
});

// const { auth } = require('express-openid-connect');

// const config = {
//   authRequired: false,
//   auth0Logout: true,
//   secret: 'a long, randomly-generated string stored in env',
//   baseURL: 'https://www.anthropals.social',
//   clientID: process.env.CLIENT_ID,
//   issuerBaseURL: 'https://ncarmont.eu.auth0.com'
// };
// app.use(auth(config));

// // req.isAuthenticated is provided from the auth router
// app.get('/auth', (req, res) => {
//   res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
// });

app.get('/test', async (req, res) => {
  const mes = await main("AI")
  res.send(JSON.stringify(mes))
});


app.get('/message', (req, res) => {
  try {
    client.messages
    .create({
        body: 
`Hi there from AnthroPals! 👋 I\'m here to keep your social calendar up and buzzing.

What topics are you interested in? Give me one/two topics (e.g AI, Spanish, etc).`,
        to: '+44'+req.query.phone.replace(/^0/, ''),
        from: '+447862144615'
    })
    .then(message => console.log(message.sid)).done();

  } catch (error) {
    return new Error(error)
  }
    res.send(`<!DOCTYPE html>
    <html>
    <head>
    <link rel="icon" type="image/png" href="https://i.ibb.co/w44yFWy/DALL-E-2023-11-05-11-19-20-Design-a-logo-for-Anthro-Pals-an-innovative-AI-assisted-event-discovery-p.png" />

      <title>Registration Success</title>
      
      <style>
        /* Modern theme styles */
        
        body {
          background-color: #f2f2f2;
          font-family: Arial, sans-serif;   
        }
        
        .container {
          max-width: 500px;  
          margin: 0 auto;
          background-color: #fff;
          padding: 30px; 
          border-radius: 5px;
          text-align: center; 
        }
        
        h1 {
          color: #179CC3;
        }
        footer {
          margin-top: 50px;
          text-align: center;
      }
      
      footer a {
          color: #aaa; 
      }
      
        p {
          font-size: 1.2em; 
        }
        
      </style>
      
    </head>
    
    <body>
    
      <div class="container">
    
        <h1>Registration Successful!</h1>  
    
        <p>
          Thank you for registering! You should receive a confirmation SMS shortly.
        </p>
    
        <p>
          Please verify your number to activate your account.
        </p>
    
        <p>
          Welcome aboard! Let us know if you have any other questions.
        </p>
        <a href="./" style="background-color:#F97E27; color: #fff; padding: 10px 15px; text-decoration: none;">Back to Home</a>

    
      </div>
    
    </body>
    <footer>
    <p>
      <a href="/privacy">Privacy Policy</a> |  
      <a href="/termsOfService">Terms of Service</a>
    </p>
  </footer>
    </html>`);
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
      color: #F97E27; 
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
      outline: 2px solid #F97E27;
    }
    
    button {
      padding: 12px 30px;
      font-size: 1em; 
      background-color: #F97E27;
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
        background-color: #F97E27;
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
      <img style="margin: 0 auto; text-align: center; width: 100%; padding: 20px 100px; border-radius: 20px;" src="https://i.ibb.co/w44yFWy/DALL-E-2023-11-05-11-19-20-Design-a-logo-for-Anthro-Pals-an-innovative-AI-assisted-event-discovery-p.png" alt="AnthroPals Logo">
      
        <h1>AnthroPals</h1>
        
        <h2 class="text-center">Increasing the world's face time</h2>
        
        <p class="text-center">
          AnthroPals pre-fills your social calendar with relevant events for you during the week.
        </p>

    <form >
        <label for="phone">Phone Number:</label>
        
        <input type="tel" id="phone" name="phone" required>
        
        <button type="submit">Submit</button>
    </form>
  
      <button id="btn-google" class="btn btn-block btn-google">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/768px-Google_%22G%22_Logo.svg.png"> Log in with Google
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

  window.location.href = "/message?phone="+phone.replace("+44","");
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

const eventsImpr = {"events":[
  `<event url=https://www.eventbrite.co.uk/e/dynamo-talks-with-northumbria-university-the-north-east-ai-safety-summit-tickets-718529901277>{"title": "Dynamo Talks with Northumbria University: The North East AI Safety Summit", "event_description": "Join this pioneering AI safety debate and have your voice heard!", "demographics": "Anyone interested in AI safety", "keywords": ["AI", "safety", "ethics", "debate"], "time_start": "2023-10-27T08:00:00+01:00", "time_end": "2023-10-27T10:00:00+01:00", "location": "1 Northumberland Road, Newcastle upon Tyne, NE1 8DX", "cost_in_pounds": 0, "activity_types": ["learning", "debate"]}</event>`,
  `<event url=https://lu.ma/ie2trx7c>{"title": "All Things AI: The Future of the UK AI Ecosystem", "event_description": "A discussion on the future of the UK AI ecosystem and how regulators and the startup community can work together.", "demographics": "People interested in AI, startups, and regulation", "keywords": ["AI", "startups", "regulation", "ecosystem"], "time_start": "2023-10-24T18:00:00+01:00", "time_end": "2023-10-24T21:00:00+01:00", "location": "Public Hall powered by Huckletree, London", "cost_in_pounds": 0, "activity_types": ["learning", "networking"],  "food_and_drink": true}</event>`,
  `<event url=https://www.meetup.com/kanban-mentoring-circle/events/295926371/>{"title": "Boost your productivity with Professional Kanban - Session 1", "event_description": "A guided learning session introducing Professional Kanban and The Kanban Guide.", "demographics": "Anyone interested in Kanban and agile project management", "keywords": ["Agile Project Management", "Kanban", "Agile and Scrum"], "time_start": "2023-11-15T19:30:00+00:00", "time_end": "2023-11-15T21:00:00+00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["Learning"], "estimated_number_of_attendees": 41}</event>`,
  `<event url=https://www.eventbrite.co.uk/e/733450047837>{"title": "AI Fringe Day 2: Expanding the conversation; defining AI safety in practice", "event_description": "Day Two expands the conversation around AI safety, exploring how we define it, who gets to define it and what it looks like in practice.", "demographics": "Those interested in AI safety and ethics", "keywords": ["AI", "safety", "ethics"], "time_start": "2023-10-31T08:30:00+00:00", "time_end": "2023-10-31T16:30:00+00:00", "location": "96 Euston Road, London, NW1 2DB", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"]}</event>`,
  `<event url=https://lu.ma/responsible-AI-charities>{"title": "How can non-profits use AI responsibly?", "event_description": "A one hour webinar on how non-profits can harness AI's power responsibly", "demographics": "Non-profit organizations", "keywords": ["AI", "ethics", "non-profit"], "time_start": "2023-10-23T12:00:00+01:00", "time_end": "2023-10-23T13:00:00+01:00", "location": "Online Event", "cost_in_pounds": 0, "activity_types": ["learning"]}</event>`,
  `<event url=https://www.meetup.com/uk-data-vault-user-group/events/295004672/>{"title": "Fifty First Dates with Data Vault", "event_description": "Bringing Data Vault to a new company can be a daunting task. Its proof of concept work is likely going to be built by you, and no one else.", "demographics": "Data professionals", "keywords": ["Data Vault", "Data Modeling"], "time_start": "2023-11-15T16:00:00+00:00", "time_end": "2023-11-15T17:00:00+00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["Learning"]}</event>`,
  `<event url=https://www.eventbrite.com/e/ai-exploration-innovation-inclusion-tickets-737125621577>{"title": "AI + Exploration | Innovation + inclusion", "event_description": "Join us for a roundtable discussion with our panel of experts and artists to explore rapid AI innovation within the creative industry.", "demographics": "Those interested in AI, creativity, and ethics", "keywords": ["AI", "art", "innovation", "inclusion"], "time_start": "2023-10-27T14:00:00+01:00", "time_end": "2023-10-27T16:00:00+01:00", "location": "Lincoln Museum, Lincoln, England", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"],  "food_and_drink": true, "estimated_number_of_attendees": 50}</event>`,
  `<event url=https://lu.ma/xwy99hg8>{"title": "AI Report Launch - with the Startup Coalition, Onward and TBI", "event_description": "Official launch of the first report of the Startup Coalition, Onward and TBI's joint AI Project.", "demographics": "Founders and ecosystem leaders in AI startups", "keywords": ["AI", "startup", "report", "launch"], "time_start": "2023-10-26T17:30:00+01:00", "time_end": "2023-10-26T20:30:00+01:00", "location": "18 Smith Square, London, SW1P 3HZ", "cost_in_pounds": 0, "activity_types": ["learning", "networking"],  "food_and_drink": true}</event>`,
  `<event url=https://www.eventbrite.co.uk/e/idsai-seminar-with-petar-velickovic-university-of-cambridge-tickets-732844566827?aff=oddtdtcreator>{"title": "IDSAI Seminar with Petar Veli\u010dkovi\u0107, University of Cambridge", "event_description": "The Institute of Data Science and AI seminar series showcases innovative research in data science and AI from across the world.", "demographics": "Data scientists, AI researchers, academics", "keywords": ["data science", "AI", "research", "seminar"], "time_start": "2023-10-27T13:45:00+01:00", "time_end": "2023-10-27T15:30:00+01:00", "location": "3 Symphony Park, Manchester, M1 7FS", "cost_in_pounds": 0, "activity_types": ["learning", "networking"]}</event>`,
  `<event url=https://www.meetup.com/thalesians/events/296185127/>{"title": "Seminar: Robert Carver: The Futures Trend Following Strategy", "event_description": "A seminar on the futures trend following strategy by Robert Carver", "demographics": "Those interested in quantitative finance", "keywords": ["quantitative finance", "futures", "trend following"], "time_start": "2023-11-08T18:30:00+00:00", "time_end": "2023-11-08T20:00:00+00:00", "location": "G-Research, London, UK", "cost_in_pounds": 0, "activity_types": ["learning"],  "food_and_drink": true, "estimated_number_of_attendees": 50}</event>`,
  `<event url=https://www.meetup.com/richmond-twickenham-book-club/events/294749431/>{"title": "November [Classics] | The Master and Margarita by Mikhail Bulgakov", "event_description": "Book club discussion of The Master and Margarita by Mikhail Bulgakov", "demographics": "Adults interested in literature and book clubs", "keywords": ["Literature", "Book Club", "Novel Reading"], "time_start": "2023-11-08T18:30:00", "time_end": "2023-11-08T20:30:00", "location": "Rincon Bar Espanol, 1 Paradise Road, Richmond, 17", "cost_in_pounds": 0, "activity_types": ["Learning", "Discussion"], "estimated_number_of_attendees": 20}</event>`,
  `<event url=https://aifringe.org/events#contact>{"title": "Expanding the conversation: AI for everyone", "event_description": "Day one at the AI Fringe Hub will set the scene for the week\u2019s conversations, exploring the benefits and risks of AI, its impact on underrepresented communities, research across the devolved nations, and more.", "demographics": "Anyone interested in AI", "keywords": ["AI", "ethics", "safety", "policy"], "time_start": "2023-10-30T00:00:00", "time_end": "2023-10-30T23:59:59", "location": "Knowledge Centre at The British Library", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "estimated_number_of_attendees": 100}</event>`,
  `<event url=https://aifringe.org/events?d7c033ac_page=2>{"title": "The Possibilities of AI and Good Work", "event_description": "A panel discussion on the role of AI in good work.", "demographics": "Those interested in AI and its impact on work and employment", "keywords": ["AI", "work", "employment", "panel"], "time_start": "2023-10-30T00:00:00", "time_end": "2023-10-30T23:59:59", "location": "British Academy \u2014 London", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "estimated_number_of_attendees": 50}</event>`,
  `<event url=https://www.meetup.com/tooting-book-club/events/295194234/>{"title": "Discuss: The Seven Moons of Maali Almeida by Shehan Karunatilaka", "event_description": "Discussion of the novel The Seven Moons of Maali Almeida", "demographics": "Book club members", "keywords": ["Literature", "Book Club", "Reading", "Intellectual Discussions", "Fiction"], "time_start": "2023-11-07T19:15:00+00:00", "time_end": "2023-11-07T21:15:00+00:00", "location": "The Trafalgar Arms, 148-156 Tooting High Street, London, 17", "cost_in_pounds": 2, "activity_types": ["learning", "networking"]}</event>`,
  `<event url=https://www.meetup.com/personal-growth-and-healing-book-club-support/events/296223760/>{"title": "NOVEMBER - Monthly Well-being Book Club Meeting [ONLINE]", "event_description": "A monthly online book club meeting focused on well-being and personal development", "demographics": "Adults interested in personal growth and mental wellness", "keywords": ["Book club", "Personal development", "Mental health"], "time_start": "2023-11-15T19:00:00+00:00", "time_end": "2023-11-15T20:00:00+00:00", "location": "Online", "cost_in_pounds": 0, "activity_types": ["Learning", "Discussion"]}</event>`,
  `<event url=https://www.tickettailor.com/events/datafest/1033543>{"title": "The National Robotarium: What we do", "event_description": "Join The National Robotarium to find out about the work they do, experience a spotlight information session with one of the resident companies that works within The National Robotarium, and finish the session with a tour around the building.", "demographics": "Anyone interested in robotics and automation", "keywords": ["Robotics", "Automation", "Technology"], "time_start": "2023-10-24T13:00:00", "time_end": "2023-10-24T15:00:00", "location": "The National Robotarium", "cost_in_pounds": 0, "activity_types": ["Learning", "Networking"]}</event>`,
  `<event url=https://www.meetup.com/>{"title": "Find Local Groups, Events, and Activities Near You", "event_description": "Find Meetup events, join groups, or start your own. Make new friends and connect with like-minded people. Meet people near you who share your interests.", "demographics": "People interested in finding local events and activities", "keywords": ["events", "activities", "groups", "meetups"], "time_start": "2023-11-05T00:00:00", "time_end": "2023-11-30T23:59:59", "location": "Online", "cost_in_pounds": 0, "activity_types": ["learning", "social", "networking"]}</event>`,
  `<event url=https://www.meetup.com/find/gb--london/#main>{"title": "Discuss: The Seven Moons of Maali Almeida by Shehan Karunatilaka", "event_description": "Book club discussion of The Seven Moons of Maali Almeida", "demographics": "Book club members", "keywords": ["book", "club", "discussion"], "time_start": "2023-11-07T19:15:00+00:00", "time_end": "2023-11-07T20:15:00+00:00", "location": "Tooting, London", "cost_in_pounds": 2, "activity_types": ["learning", "discussion"]}</event>`,
  `<event url=https://www.meetup.com/agile-mastery-meetup/events/295927117/>{"title": "Mastering Emotional Intelligence", "event_description": "An introduction to emotional intelligence and how to develop it in teams.", "demographics": "Agile professionals", "keywords": ["Team Work", "Agile Project Management", "Agile Leadership", "Agile Transformation", "Agile Coaching"], "time_start": "2023-11-07T18:00:00", "time_end": "2023-11-07T19:00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["Learning"]}</event>`,
  `<event url=https://www.meetup.com/virtual-spanish-and-latin-american-literature-book-group/events/296130460/>{"title": "Los ca\u00eddos de Carlos Manuel \u00c1lvarez - Cuba", "event_description": "Discussion of the novel 'Los ca\u00eddos' by Carlos Manuel \u00c1lvarez", "demographics": "Those interested in Spanish and Latin American literature", "keywords": ["Spanish", "Literature", "Book Club", "Novel Reading", "Reading"], "time_start": "2023-11-07T19:00:00+00:00", "time_end": "2023-11-07T20:00:00+00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["Learning", "Reading"]}</event>`,
  `<event url=https://www.eventbrite.co.uk/e/733447209347>{"title": "AI Fringe Day 3: Digging deeper; AI, biology, people, culture and climate", "event_description": "Day Three \u2013 coinciding with the first day of the UK Government-hosted Summit - explores AI in health, public voice, creativity, and markets.", "demographics": "Those interested in AI, technology, biology, people, culture and climate", "keywords": ["AI", "biology", "people", "culture", "climate"], "time_start": "2023-11-01T08:30:00+00:00", "time_end": "2023-11-01T16:30:00+00:00", "location": "Knowledge Centre \u2014 The British Library, London, England", "cost_in_pounds": 0, "activity_types": ["learning", "networking"]}</event>`,
  `<event url=https://www.meetup.com/find/?source=EVENTS>{"title": "Queer Book Club - Paul Takes the Form of a Mortal Girl by Andrea Lawlor", "event_description": "We read books about, for and written by queer people!", "demographics": "Queer community", "keywords": ["books", "queer", "literature"], "time_start": "2023-11-08T19:00:00+00:00", "time_end": "2023-11-08T21:00:00+00:00", "location": "Commonwealth in Park Slope BK", "cost_in_pounds": 0, "activity_types": ["learning", "networking"], "estimated_number_of_attendees": 20}</event>`,
  `<event url=https://www.meetup.com/the-tarot-method/events/291512906/>{"title": "The Tarot Method Practice Group: Check in With Your Deck", "event_description": "A guided experience to check in on your tarot journey and learn new strategies and techniques.", "demographics": "Beginners and experienced tarot readers", "keywords": ["tarot", "spirituality", "self-reflection"], "time_start": "2023-11-05T14:00:00", "time_end": "2023-11-05T15:30:00", "location": "Online via Zoom", "cost_in_pounds": 0, "activity_types": ["learning", "spirituality"]}</event>`,
  `<event url=https://www.meetup.com/find/online-events/>{"title": "Online Events | Attend virtual events from anywhere | Meetup", "event_description": "Online events are a great way to find your community!", "demographics": "Anyone interested in virtual events", "keywords": ["online", "virtual", "games", "tech", "socializing"], "time_start": "2023-11-15T23:00:00+00:00", "time_end": "2023-11-16T00:00:00+00:00", "location": "Online", "cost_in_pounds": 0, "activity_types": ["learning", "games", "tech", "social"]}</event>`,
  `<event url=https://www.meetup.com/open-finance-developers-group/events/295902753/>{"title": "Securing Your Open Finance APIs", "event_description": "A technical deep-dive into baking security into Open Finance APIs and services", "demographics": "Open Finance developers", "keywords": ["cybersecurity", "APIs", "finance"], "time_start": "2023-11-08T17:00:00+00:00", "time_end": "2023-11-08T19:00:00+00:00", "location": "The Leadenhall Building, London", "cost_in_pounds": 0, "activity_types": ["learning", "networking"], "estimated_number_of_attendees": 77}</event>`,
  `<event url=https://www.meetup.com/london-meetups/events/296529800/>{"title": "Networking for founders, creators, freelancers + rebels \u26a1", "event_description": "Casual networking events with the occasional fireside chats from founders, creators and successful business owners.", "demographics": "Founders, creators, freelancers, rebels", "keywords": ["Professional Networking", "Entrepreneurship", "Entrepreneur Networking", "Startup Businesses"], "time_start": "2023-11-06T18:00:00+00:00", "time_end": "2023-11-06T20:30:00+00:00", "location": "Home Grown | Private Members' Club London", "cost_in_pounds": 0, "activity_types": ["networking", "learning"],  "food_and_drink": true, "estimated_number_of_attendees": 120}</event>`,
  `<event url=https://www.meetup.com/a-space-to-write/events/294162242/>{"title": "A Space to Write: Secrets", "event_description": "A 1.5 hour creative writing session on the theme of secrets", "demographics": "Writers of all levels", "keywords": ["writing", "creative writing", "secrets", "fiction"], "time_start": "2023-11-19T16:00:00", "time_end": "2023-11-19T17:30:00", "location": "Online", "cost_in_pounds": 0, "activity_types": ["learning", "writing"]}</event>`,
  `<event url=https://www.oii.ox.ac.uk/news-events/events/searching-for-a-place-at-the-table-what-is-the-role-of-the-united-kingdom-in-the-development-and-regulation-of-artificial-intelligence/>{"title": "OII | Searching for a Place at the Table: What is The Role of the United Kingdom in the Development and Regulation of Artificial Intelligence?", "event_description": "Join us for a panel discussion on the role of the United Kingdom in the development and regulation of AI.", "demographics": "Those interested in AI policy and regulation", "keywords": ["AI", "policy", "regulation", "UK"], "time_start": "2023-10-19T18:00:00+00:00", "time_end": "2023-10-19T19:30:00+00:00", "location": "Online", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "estimated_number_of_attendees": 50}</event>`,
  `<event url=https://aifringe.org/events/>{"title": "Expanding the conversation: AI for everyone", "event_description": "Day one at the AI Fringe Hub will set the scene for the week\u2019s conversations, exploring the benefits and risks of AI, its impact on underrepresented communities, research across the devolved nations, and more.", "demographics": "Anyone interested in AI", "keywords": ["AI", "ethics", "safety", "policy"], "time_start": "2023-10-30T00:00:00", "time_end": "2023-10-30T23:59:59", "location": "Knowledge Centre at The British Library", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "estimated_number_of_attendees": 100}</event>`,
  `<event url=https://www.eventbrite.co.uk/e/733357681567>{"title": "AI Fringe Day 1: Expanding the conversation; AI for everyone", "event_description": "Day One will set the scene for the week\u2019s conversations, exploring the benefits and risks of AI, its impact, ongoing research, and more.", "demographics": "Anyone interested in AI and its impact", "keywords": ["AI", "technology", "ethics", "research"], "time_start": "2023-10-30T08:30:00+00:00", "time_end": "2023-10-30T16:30:00+00:00", "location": "96 Euston Road, London, NW1 2DB", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "estimated_number_of_attendees": 100}</event>`,
  `<event url=https://www.eventbrite.co.uk/e/733436136227>{"title": "AI Fringe Day 4: Digging deeper; Work, safety, law and democracy", "event_description": "Day Four dives into AI and the future of work, law and bias, AI safety cultures, and information and democracy.", "demographics": "Those interested in AI, ethics and policy", "keywords": ["AI", "ethics", "policy", "work", "law", "safety"], "time_start": "2023-11-02T08:30:00+00:00", "time_end": "2023-11-02T16:30:00+00:00", "location": "96 Euston Road, London, NW1 2DB", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"]}</event>`,
  `<event url=https://www.meetup.com/source-talks-superwomen-in-tech/events/296252450/>{"title": "Breaking Barriers: Unconscious Bias in Hiring", "event_description": "A panel discussion on unconscious bias in hiring", "demographics": "Tech professionals interested in diversity and inclusion", "keywords": ["diversity", "inclusion", "hiring", "unconscious bias"], "time_start": "2023-11-15T17:00:00", "time_end": "2023-11-15T18:00:00", "location": "Meetup via Zoom", "cost_in_pounds": 0, "activity_types": ["learning", "networking"]}</event>`,
  `<event url=https://www.eventbrite.co.uk/e/733418202587>{"title": "AI Fringe Day 5: Looking ahead; what next for AI?", "event_description": "Day Five delves into the topics and insights from across the AI Fringe and at the Government-hosted Summit, looking ahead to what\u2019s next.", "demographics": "Those interested in AI and its future applications", "keywords": ["AI", "Fringe", "Future", "Summit"], "time_start": "2023-11-03T08:30:00+00:00", "time_end": "2023-11-03T13:30:00+00:00", "location": "96 Euston Road, London, NW1 2DB", "cost_in_pounds": 0, "activity_types": ["learning"]}</event>`,
  `<event url=https://www.meetup.com/comic-and-graphic-novel-readers-club/events/296227058/>{"title": "Miracleman - Alan Moore", "event_description": "Discussion of Alan Moore's deconstruction of superhero comics with Miracleman", "demographics": "Comic book fans", "keywords": ["Comic Books", "Sci-Fi/Fantasy"], "time_start": "2023-11-07T19:00:00", "time_end": "2023-11-07T21:00:00", "location": "Prince of Wales, London", "cost_in_pounds": 0, "activity_types": ["Learning", "Discussion"]}</event>`,
  `<event url=https://aifringe.org#partners>{"title": "Expanding the conversation: AI for everyone", "event_description": "Day one at the AI Fringe Hub will set the scene for the week\u2019s conversations, exploring the benefits and risks of AI, its impact on underrepresented communities, research across the devolved nations, and more.", "demographics": "Anyone interested in AI", "keywords": ["AI", "ethics", "safety", "inclusion"], "time_start": "2023-10-30T00:00:00", "time_end": "2023-10-30T23:59:59", "location": "Knowledge Centre at The British Library", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "estimated_number_of_attendees": 100}</event>`,
  `<event url=https://www.meetup.com/tech-talks-diversity-inclusion-and-equity/events/292662463/>{"title": "Inclusive organisational design", "event_description": "A panel discussion to explore problems and solutions around inclusive organisational design and how technology can support it.", "demographics": "Anyone interested in diversity, inclusion and organisational design", "keywords": ["diversity", "inclusion", "organisational design", "technology"], "time_start": "2023-11-21T18:30:00+00:00", "time_end": "2023-11-21T20:30:00+00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"]}</event>`,
  `<event url=https://aifringe.org/events#>{"title": "Expanding the conversation: AI for everyone", "event_description": "Day one at the AI Fringe Hub will set the scene for the week\u2019s conversations, exploring the benefits and risks of AI, its impact on underrepresented communities, research across the devolved nations, and more.", "demographics": "Anyone interested in AI", "keywords": ["AI", "ethics", "safety", "policy"], "time_start": "2023-10-30T00:00:00", "time_end": "2023-10-30T23:59:59", "location": "Knowledge Centre at The British Library", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "estimated_number_of_attendees": 100}</event>`,
  `<event url=https://partiful.com/e/pQHQrWPg1A6P31AYZMTd>{"title": "Anthropic AI Hackathon London", "event_description": "AI Hackathon hosted by Anthropic in London", "demographics": "Anyone interested in AI", "keywords": ["AI", "ethics", "safety", "policy"], "time_start": "2023-11-6T00:00:00", "time_end": "2023-11-7T23:59:59", "location": "Knowledge Centre at The British Library", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "estimated_number_of_attendees": 100}</event>`
  ]}