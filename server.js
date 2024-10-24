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
const { ObjectId } = require('mongodb');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

passport.use(
  new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `/auth/google/callback`
},
async function(accessToken, refreshToken, profile, done) {
  const newUser = {
            googleId: profile.id,
            displayName: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            image: profile.photos[0].value,
          }
   
          try {            
            let user = await mongodb
            .getDb()
            .collection('users')
            .findOne({googleId: profile.id});

            if (user) {
              done(null, user)
            } else {
              const result = await mongodb
                .getDb()
                .collection('users')
                .insertOne(newUser);
              done(null, { ...newUser, _id: result.insertedId }); // Make sure to include the _id from MongoDB
            }
          } catch (err) {
            done(err, null);
            console.error(err)
          }

}
));

passport.serializeUser((user, done) => {
  done(null, user._id); // Use _id instead of id (this is the difference in mongoose vs mongodb
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await mongodb
      .getDb()
      .collection('users')
      .findOne({ _id: ObjectId.createFromHexString(id) });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Swagger setup
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use(bodyParser.json());

app.use(express.json());

const mongoURI = process.env.MONGODB_URI;


// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, //Set to true in production with HTTPS
    store: MongoStore.create({ mongoUrl: mongoURI }),
  })
);
// Passport setup
app.use(passport.session());
app.use(passport.initialize());

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

// Define a route for the root URL
app.get('/', (req, res) => {
  console.log(req.session.user);
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

app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials
}));


// Routes
app.use('/', require('./cse-341-project2/routes'));

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
