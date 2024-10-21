const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contacts');
const { body } = require('express-validator');
const { isAuthenticated } = require('../middleware/auth');

// Validation middleware
const validateContact = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('address').optional(),
  body('city').optional(),
  body('country').optional(),
  body('favoriteColor').optional(),
  body('birthday').optional().isISO8601().toDate().withMessage('Invalid date format')
];

// Routes
router.get('/', isAuthenticated, contactsController.getAllContacts);
router.get('/:id', isAuthenticated, contactsController.getContactById);
router.post('/', isAuthenticated, validateContact, contactsController.createContact);
router.put('/:id', isAuthenticated, validateContact, contactsController.updateContact);
router.delete('/:id', isAuthenticated, contactsController.deleteContact);

module.exports = router;