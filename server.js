const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mongodb = require('./cse-341-project2/db/connect');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const fs = require('fs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./cse-341-project2/models/User');
const { userInfo } = require('os');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials
}));

app.use(express.json());

const mongoURI = process.env.MONGODB_URI;

// Swagger setup
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `/auth/google/callback`
},
async function(accessToken, refreshToken, profile, done) {
  console.log(profile);
  const newUser = {
            googleId: profile.id,
            displayName: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            image: profile.photos[0].value,
          }
   
          try {
            let user = await User.findOne({ googleId: profile.id })
   
            if (user) {
              done(null, user)
            } else {
              user = await User.create(newUser)
              done(null, user)
            }
          } catch (err) {
            console.error(err)
          }
}
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Z-Key'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Routes
app.use('/', require('./cse-341-project2/routes'));

// Define a route for the root URL
app.get('/', (req, res) => {
  res.send(
    req.session.user !== undefined
      ? `${req.session.user.displayName} -- Welcome to Contatcs API by Jonathan Aloya`
      : 'Logged Out'
  );
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database connection
mongodb.initDb((err) => {
  if (err) {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  } else {
    app.listen(port, () => {
      console.log(`Connected to DB and server running on port ${port}`);
      console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
    });
  }
});
