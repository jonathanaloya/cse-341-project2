const express = require('express');
const dotenv = require('dotenv');
const mongodb = require('./cse-341-project2/db/connect');
const authRoutes = require('./cse-341-project2/routes/auth'); // Import auth routes
const auth = require('./cse-341-project2/middleware/auth'); // Import auth middleware
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const User = require('./cse-341-project2/models/User'); // Assuming you have a User model
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();

require('dotenv').config(); // Ensure this is at the top of your file

const mongoURI = process.env.MONGODB_URI; // Use the environment variable

// CORS middleware - restrict allowed origins
app.use(cors({
  origin: ['http://localhost:3003'], // Specify allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json()); // Ensure you can parse JSON requests


let contacts = []; // In-memory array to store contacts

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'));


let members = [];
// In-memory array to store users
let users = [];

app.post('/contacts', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const newContact = {
    id: contacts.length + 1, // Simple ID generation
    name,
    email
  };
  contacts.push(newContact); // Store the new contact
  res.status(201).json(newContact); // Respond with the created contact
});

app.get('/contacts', (req, res) => {
  res.json(contacts);
});

// Route to get a contact by ID
app.get('/contacts/:id', (req, res) => {
  const contactId = parseInt(req.params.id, 10); // Parse the ID from the URL
  const contact = contacts.find(c => c.id === contactId); // Find the contact by ID

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' }); // Return 404 if not found
  }

  res.json(contact); // Respond with the found contact
});

const port = process.env.PORT || 3003; // Change this to a different port, e.g., 3000
// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};
// Route to create a new contact


app.get('/users/:id', isAuthenticated, (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  // Return user information without the password
  const { password, ...userInfo } = user;
  res.json(userInfo);
});



// Add error handling for the server instance
server.on('error', (error) => {
  console.error('Server error:', error);
  // Handle specific error types if needed
});

// Initialize database connection
mongodb.initDb((err) => {
  if (err) {
    console.error('Failed to connect to the database:', err);
    process.exit(1);
  } else {
    console.log(`Connected to DB and server running on port ${port}`);
    console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
  }
});

// Add error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Route to register a new user
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }
  // Additional validation can be added here

  const hashedPassword = await bcrypt.hash(password, 12); // Use a higher number of rounds
  const newUser = { id: users.length + 1, username, email, password: hashedPassword };
  users.push(newUser);
  res.status(201).json({ message: 'User registered successfully' });
});

// Route to log in a user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. Find user by email
    const user = await User.findOne({ email }); // Removed timeout as it's not a valid method for mongoose
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Create session or token (if applicable)
    // Example: req.session.userId = user._id; // For session-based auth
    // Example: const token = generateToken(user); // For token-based auth

    res.status(200).json({ message: 'Login successful', userId: user._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to log out a user
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Route to get all contacts (protected)
app.get('/contacts', isAuthenticated, (req, res) => {
  res.json(contacts);
});

// Route to create a new contact (protected)
app.post('/contacts', isAuthenticated, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const newContact = {
    id: contacts.length + 1, // Simple ID generation
    name,
    email
  };
  contacts.push(newContact);
  res.status(201).json(newContact);
});

// Route to get user information by ID (protected)
app.get('/users/:id', isAuthenticated, (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  // Return user information without the password
  const { password, ...userInfo } = user;
  res.json(userInfo);
});

// Route to get the logged-in user's information (protected)
app.get('/me', isAuthenticated, (req, res) => {
  const userId = req.session.user.id; // Get the ID from the session
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  // Return user information without the password
  const { password, ...userInfo } = user;
  res.json(userInfo);
});

// Session setup with secure options
app.use(session({
  secret: process.env.GITHUB_CLIENT_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    httpOnly: true, // Prevent client-side access to cookies
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  },
}));

// Swagger setup


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Z-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Define a route for the root URL
app.get('/', (req, res) => {
  let html = '<h1>Member Records</h1>';
  html += '<ul>';
  members.forEach(member => {
    html += `<li>${member.firstName} ${member.lastName} - ${member.email}</li>`;
  });
  html += '</ul>';
  res.send(html);
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/protected', auth, (req, res) => {
  res.status(200).json({ message: 'This is a protected route', user: req.user });
});

// Routes
app.use('/api', require('./cse-341-project2/routes/api'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Route to register a new member
app.post('/members', (req, res) => {
  const { firstName, lastName, email } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }
  
  const newMember = {
    id: members.length + 1, // Simple ID generation
    firstName,
    lastName,
    email
  };
  
  // Store the new member in the members array
  members.push(newMember);
  
  res.status(201).json(newMember); // Respond with the created member
});

// Route to get all members
app.get('/members', (req, res) => {
  res.json(members); // Respond with the members array
});
