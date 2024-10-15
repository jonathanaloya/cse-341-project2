const express = require('express');
const dotenv = require('dotenv');
const mongodb = require('./cse-341-project2/db/connect');
const authRoutes = require('./cse-341-project2/routes/auth'); // Import auth routes
const auth = require('./cse-341-project2/middleware/auth'); // Import auth middleware
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // Adjust this to your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
const port = process.env.PORT || 3003; // Change this to a different port, e.g., 3000

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'));
app.use(express.json());
let contacts = [];

let members = [];
// In-memory array to store users
let users = [];

app.get('/contacts', (req, res) => {
  res.json(contacts);
});

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};
// Route to create a new contact
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
  contacts.push(newContact);
  res.status(201).json(newContact);
});

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

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
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
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, username, email, password: hashedPassword };
  users.push(newUser);
  res.status(201).json({ message: 'User registered successfully' });
});

// Route to log in a user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  req.session.user = { id: user.id, username: user.username };
  res.json({ message: 'Logged in successfully' });
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

// Session setup (optional, if using sessions)
app.use(session({
  secret: process.env.GITHUB_CLIENT_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
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
