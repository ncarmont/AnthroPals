const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const eventsJson = require('./all_events.json');
const bodyParser = require('body-parser');
const app = express();
const accountSid = 'AC27655ac42ecf740b31e84da34a6c442d';
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require('twilio')(accountSid, authToken);
const { MessagingResponse } = require('twilio').twiml;
const Anthropic = require('@anthropic-ai/sdk');

app.use(bodyParser.urlencoded({ extended: false }));
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const { google } = require('googleapis');



const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Use the GoogleStrategy within Passport
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://www.anthropals.social/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

// Configure Express
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// GET /auth/google
// Use passport.authenticate() as route middleware to authenticate the request
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/calendar', 'profile', 'email'] })
);

// GET /auth/google/callback
// Use passport.authenticate() as route middleware to authenticate the request
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect home
    res.redirect('/');
  }
);

// Access the Google Calendar API
app.get('/calendar', (req, res) => {
  if (!req.user) {
    res.status(401).send('You need to sign in with Google');
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'https://www.anthropals.social/auth/google/callback'
  );

  oauth2Client.setCredentials({
    access_token: req.user.accessToken
  });

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, result) => {
    if (err) {
      res.status(500).send('Error retrieving calendar events');
      console.error('The API returned an error: ' + err);
      return;
    }
    const events = result.data.items;
    res.status(200).json(events);
  });
});



const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main(lastMessageBody) {
  const userQuestion = `
  Be as concise as possible and give your response in bullet points (e.g "- AI Event from 2-3pm on 10/10/2023")
  Given these events ${JSON.stringify(eventsImpr)} 
  
  I have the following user preference for events: ${lastMessageBody}.
  What 3 events should I go to (including date and time) within the next week given today is ${new Date().toISOString()}?
  
  If there are no relevant events in the designated timeframe, please respond with "No events". Please do not return events unless they match the user's preferences.`
  const completion = await anthropic.completions.create({
    model: 'claude-instant-1',
    max_tokens_to_sample: 300,
    prompt: `\n\nHuman: ${userQuestion}\n\nAssistant:`,
  });
  console.log(completion.completion);
  return completion.completion
}
  

app.post('/sms', async (req, res) => {
  const twiml = new MessagingResponse();
  console.log(req.body);
  
  const lastMessageBody = req.body.Body; // The text body of the last incoming message
  console.log(`Last incoming message: ${lastMessageBody}`);

  // Your main function which presumably does some processing and returns a message
  const mes = await main(lastMessageBody);
  twiml.message(mes.replace(/\\n/g, '\n'))

  res.type('text/xml').send(twiml.toString());
});

const { auth } = require('express-openid-connect');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'https://www.anthropals.social',
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: 'https://ncarmont.eu.auth0.com'
};
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/auth', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});


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

What topics are you interested in? Give me one/two topics (e.g AI, energy, cooking, sports).`,
        to: '+44'+req.query.phone.replace(/^0/, ''),
        from: '+447862144615'
    })
    .then(message => console.log(message.sid)).done();

  } catch (error) {
    
  }
 

    res.send(`<!DOCTYPE html>
    <html>
    <head>
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
          color: #dd4b39;
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
        <a href="./" style="background-color: #dd4b39; color: #fff; padding: 10px 15px; text-decoration: none;">Back to Home</a>

    
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

const events = [
  {
    "eventName": "AI Conference", 
    "eventDate": "2023-11-05",
    "startTime": "5:00pm",
    "endTime": "9:00pm",
    "eventLocation": "Convention Center",
    "eventDescription": "Annual conference on AI, machine learning and deep learning. Keynote speeches, workshops and exhibits from industry leaders.",
    "speakerList": ["Andrew Ng", "Fei-Fei Li", "Yann LeCun"]
  },
  {  
    "eventName": "Robotic Competition",
    "eventDate": "2023-11-05",
    "startTime": "6:00pm", 
    "endTime": "9:00pm",
    "eventLocation": "University Campus",
    "eventDescription": "Robotics competition for high school students to build and program autonomous robots.",
    "teams": ["Team Bolt", "Gearheads", "Tech Titans"]
  },
  {
    "eventName": "AI Hackathon",
    "eventDate": "2023-11-05",
    "startTime": "6:00pm",
    "endTime": "9:00pm", 
    "eventLocation": "Startup Incubator",
    "eventDescription": "24 hour hackathon for developers to build AI prototypes and compete for prizes.",
    "sponsors": ["Google", "NVIDIA", "AWS"]
  },
  {
    "eventName": "AI Ethics Seminar",
    "eventDate": "2023-11-05",
    "startTime": "7:00pm",
    "endTime": "9:00pm",
    "eventLocation": "University Auditorium",
    "eventDescription": "Seminar discussing ethics of AI, algorithms, data privacy and surveillance.",
    "speakers": ["Joanna Bryson", "Kate Crawford", "Timnit Gebru"]
  },
  {
    "eventName": "Deep Learning Workshop",
    "eventDate": "2023-11-05",
    "startTime": "5:00pm",
    "endTime": "8:00pm",
    "eventLocation": "Maker Space", 
    "eventDescription": "2 day workshop on deep learning for computer vision and NLP. Hands-on training with TensorFlow.",
    "instructor": "Andrew Trask"
  },
  {
    "eventName": "AI Career Fair",
    "eventDate": "2023-11-05",
    "startTime": "4:00pm",
    "endTime": "8:00pm", 
    "eventLocation": "Convention Center",
    "eventDescription": "Technology career fair with major AI companies hiring.",
    "companies": ["OpenAI", "Anthropic", "Google Brain", "Meta AI"]
  },
  {
    "eventName": "Cooking Class",
    "eventDate": "2023-11-05",
    "startTime": "6:30pm",
    "endTime": "9:00pm",
    "eventLocation": "Local Community Center",
    "eventDescription": "Italian cooking class and dinner",
    "instructor": "Chef Giada De Laurentiis"
  },
  {
    "eventName": "Wine and Cheese Pairing",
    "eventDate": "2023-11-05",
    "startTime": "7:00pm",
    "endTime": "9:00pm", 
    "eventLocation": "Winery Tasting Room",
    "eventDescription": "Learn to pair wines and cheeses",
    "host": "Winery Sommelier"
  },
  {
    "eventName": "Football Game",
    "eventDate": "2023-11-05",
    "startTime": "7:30pm",
    "endTime": "10:30pm",
    "eventLocation": "Local Stadium",
    "eventDescription": "Season opening football game",
    "teams": ["Sharks", "Cougars"]
  },
  {
    "eventName": "Soccer Tournament", 
    "eventDate": "2023-11-05",
    "startTime": "8:00am",
    "endTime": "6:00pm",
    "eventLocation": "Soccer Complex",
    "eventDescription": "Annual youth soccer tournament",
    "teams": ["Strikers", "United", "FC Stars", "Lightning"]
  }
]

const eventsImpr = {"events":[
  `<event url=https://www.meetup.com/kanban-mentoring-circle/events/295926371/>{"title": "Boost your productivity with Professional Kanban - Session 1", "event_description": "A guided learning session introducing Professional Kanban and The Kanban Guide.", "demographics": "Anyone interested in Kanban and agile project management", "keywords": ["Agile Project Management", "Kanban", "Agile and Scrum"], "time_start": "2023-11-15T19:30:00+00:00", "time_end": "2023-11-15T21:00:00+00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["Learning"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": 41}</event>`,
  `<event url=https://www.meetup.com/uk-data-vault-user-group/events/295004672/>{"title": "Fifty First Dates with Data Vault", "event_description": "Bringing Data Vault to a new company can be a daunting task. Its proof of concept work is likely going to be built by you, and no one else.", "demographics": "Data professionals", "keywords": ["Data Vault", "Data Modeling"], "time_start": "2023-11-15T16:00:00+00:00", "time_end": "2023-11-15T17:00:00+00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["Learning"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/thalesians/events/296185127/>{"title": "Seminar: Robert Carver: The Futures Trend Following Strategy", "event_description": "A seminar on the futures trend following strategy by Robert Carver", "demographics": "Those interested in quantitative finance", "keywords": ["quantitative finance", "futures", "trend following"], "time_start": "2023-11-08T18:30:00+00:00", "time_end": "2023-11-08T20:00:00+00:00", "location": "G-Research, London, UK", "cost_in_pounds": 0, "activity_types": ["learning"], "interactive": true, "food_and_drink": true, "estimated_number_of_attendees": 50}</event>`,
  `<event url=https://www.meetup.com/richmond-twickenham-book-club/events/294749431/>{"title": "November [Classics] | The Master and Margarita by Mikhail Bulgakov", "event_description": "Book club discussion of The Master and Margarita by Mikhail Bulgakov", "demographics": "Adults interested in literature and book clubs", "keywords": ["Literature", "Book Club", "Novel Reading"], "time_start": "2023-11-08T18:30:00", "time_end": "2023-11-08T20:30:00", "location": "Rincon Bar Espanol, 1 Paradise Road, Richmond, 17", "cost_in_pounds": 0, "activity_types": ["Learning", "Discussion"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": 20}</event>`,
  `<event url=https://www.meetup.com/tooting-book-club/events/295194234/>{"title": "Discuss: The Seven Moons of Maali Almeida by Shehan Karunatilaka", "event_description": "Discussion of the novel The Seven Moons of Maali Almeida", "demographics": "Book club members", "keywords": ["Literature", "Book Club", "Reading", "Intellectual Discussions", "Fiction"], "time_start": "2023-11-07T19:15:00+00:00", "time_end": "2023-11-07T21:15:00+00:00", "location": "The Trafalgar Arms, 148-156 Tooting High Street, London, 17", "cost_in_pounds": 2, "activity_types": ["learning", "networking"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/personal-growth-and-healing-book-club-support/events/296223760/>{"title": "NOVEMBER - Monthly Well-being Book Club Meeting [ONLINE]", "event_description": "A monthly online book club meeting focused on well-being and personal development", "demographics": "Adults interested in personal growth and mental wellness", "keywords": ["Book club", "Personal development", "Mental health"], "time_start": "2023-11-15T19:00:00+00:00", "time_end": "2023-11-15T20:00:00+00:00", "location": "Online", "cost_in_pounds": 0, "activity_types": ["Learning", "Discussion"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/find/gb--london/#main>{"title": "Discuss: The Seven Moons of Maali Almeida by Shehan Karunatilaka", "event_description": "Book club discussion of The Seven Moons of Maali Almeida", "demographics": "Book club members", "keywords": ["book", "club", "discussion"], "time_start": "2023-11-07T19:15:00+00:00", "time_end": "2023-11-07T20:15:00+00:00", "location": "Tooting, London", "cost_in_pounds": 2, "activity_types": ["learning", "discussion"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/agile-mastery-meetup/events/295927117/>{"title": "Mastering Emotional Intelligence", "event_description": "An introduction to emotional intelligence and how to develop it in teams.", "demographics": "Agile professionals", "keywords": ["Team Work", "Agile Project Management", "Agile Leadership", "Agile Transformation", "Agile Coaching"], "time_start": "2023-11-07T18:00:00", "time_end": "2023-11-07T19:00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["Learning"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/virtual-spanish-and-latin-american-literature-book-group/events/296130460/>{"title": "Los ca\u00eddos de Carlos Manuel \u00c1lvarez - Cuba", "event_description": "Discussion of the novel 'Los ca\u00eddos' by Carlos Manuel \u00c1lvarez", "demographics": "Those interested in Spanish and Latin American literature", "keywords": ["Spanish", "Literature", "Book Club", "Novel Reading", "Reading"], "time_start": "2023-11-07T19:00:00+00:00", "time_end": "2023-11-07T20:00:00+00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["Learning", "Reading"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/find/?source=EVENTS>{"title": "Queer Book Club - Paul Takes the Form of a Mortal Girl by Andrea Lawlor", "event_description": "We read books about, for and written by queer people!", "demographics": "Queer community", "keywords": ["books", "queer", "literature"], "time_start": "2023-11-08T19:00:00+00:00", "time_end": "2023-11-08T21:00:00+00:00", "location": "Commonwealth in Park Slope BK", "cost_in_pounds": 0, "activity_types": ["learning", "networking"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": 20}</event>`,
  `<event url=https://www.meetup.com/the-tarot-method/events/291512906/>{"title": "The Tarot Method Practice Group: Check in With Your Deck", "event_description": "A guided experience to check in on your tarot journey and learn new strategies and techniques.", "demographics": "Beginners and experienced tarot readers", "keywords": ["tarot", "spirituality", "self-reflection"], "time_start": "2023-11-05T14:00:00", "time_end": "2023-11-05T15:30:00", "location": "Online via Zoom", "cost_in_pounds": 0, "activity_types": ["learning", "spirituality"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/find/online-events/>{"title": "Online Events | Attend virtual events from anywhere | Meetup", "event_description": "Online events are a great way to find your community!", "demographics": "Anyone interested in virtual events", "keywords": ["online", "virtual", "games", "tech", "socializing"], "time_start": "2023-11-15T23:00:00+00:00", "time_end": "2023-11-16T00:00:00+00:00", "location": "Online", "cost_in_pounds": 0, "activity_types": ["learning", "games", "tech", "social"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/open-finance-developers-group/events/295902753/>{"title": "Securing Your Open Finance APIs", "event_description": "A technical deep-dive into baking security into Open Finance APIs and services", "demographics": "Open Finance developers", "keywords": ["cybersecurity", "APIs", "finance"], "time_start": "2023-11-08T17:00:00+00:00", "time_end": "2023-11-08T19:00:00+00:00", "location": "The Leadenhall Building, London", "cost_in_pounds": 0, "activity_types": ["learning", "networking"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": 77}</event>`,
  `<event url=https://www.meetup.com/london-meetups/events/296529800/>{"title": "Networking for founders, creators, freelancers + rebels \u26a1", "event_description": "Casual networking events with the occasional fireside chats from founders, creators and successful business owners.", "demographics": "Founders, creators, freelancers, rebels", "keywords": ["Professional Networking", "Entrepreneurship", "Entrepreneur Networking", "Startup Businesses"], "time_start": "2023-11-06T18:00:00+00:00", "time_end": "2023-11-06T20:30:00+00:00", "location": "Home Grown | Private Members' Club London", "cost_in_pounds": 0, "activity_types": ["networking", "learning"], "interactive": true, "food_and_drink": true, "estimated_number_of_attendees": 120}</event>`,
  `<event url=https://www.meetup.com/a-space-to-write/events/294162242/>{"title": "A Space to Write: Secrets", "event_description": "A 1.5 hour creative writing session on the theme of secrets", "demographics": "Writers of all levels", "keywords": ["writing", "creative writing", "secrets", "fiction"], "time_start": "2023-11-19T16:00:00", "time_end": "2023-11-19T17:30:00", "location": "Online", "cost_in_pounds": 0, "activity_types": ["learning", "writing"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/source-talks-superwomen-in-tech/events/296252450/>{"title": "Breaking Barriers: Unconscious Bias in Hiring", "event_description": "A panel discussion on unconscious bias in hiring", "demographics": "Tech professionals interested in diversity and inclusion", "keywords": ["diversity", "inclusion", "hiring", "unconscious bias"], "time_start": "2023-11-15T17:00:00", "time_end": "2023-11-15T18:00:00", "location": "Meetup via Zoom", "cost_in_pounds": 0, "activity_types": ["learning", "networking"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/comic-and-graphic-novel-readers-club/events/296227058/>{"title": "Miracleman - Alan Moore", "event_description": "Discussion of Alan Moore's deconstruction of superhero comics with Miracleman", "demographics": "Comic book fans", "keywords": ["Comic Books", "Sci-Fi/Fantasy"], "time_start": "2023-11-07T19:00:00", "time_end": "2023-11-07T21:00:00", "location": "Prince of Wales, London", "cost_in_pounds": 0, "activity_types": ["Learning", "Discussion"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  `<event url=https://www.meetup.com/tech-talks-diversity-inclusion-and-equity/events/292662463/>{"title": "Inclusive organisational design", "event_description": "A panel discussion to explore problems and solutions around inclusive organisational design and how technology can support it.", "demographics": "Anyone interested in diversity, inclusion and organisational design", "keywords": ["diversity", "inclusion", "organisational design", "technology"], "time_start": "2023-11-21T18:30:00+00:00", "time_end": "2023-11-21T20:30:00+00:00", "location": "Virtual", "cost_in_pounds": 0, "activity_types": ["learning", "discussion"], "interactive": true, "food_and_drink": false, "estimated_number_of_attendees": null}</event>`,
  ]}