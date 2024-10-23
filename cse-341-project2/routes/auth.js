const express = require('express');
const passport = require('passport');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

// google OAuth routes
router.get('/login',
  passport.authenticate('google', { scope: ['profile'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  
  function(req, res) {
    console.log(req.user);
    req.session.user = req.user;
    // Successful authentication, redirect home.
    res.redirect('/');
  });

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.redirect('/');
  });
});

module.exports = router;