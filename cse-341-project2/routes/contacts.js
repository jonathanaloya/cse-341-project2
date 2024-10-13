// routes/contacts.js
const express = require('express');
const { body, param } = require('express-validator'); // Import validation functions
const router = express.Router();
const contactsController = require('../controllers/contacts');
const members = require('../db/members');

router.get('/', (req, res) => {
    res.status(200).json(members);
});


// GET all contacts
router.get('/', contactsController.getAllContacts);

// GET a single contact by ID
router.get('/:id', 
  param('id').isMongoId().withMessage('Invalid contact ID'), // Validate ID
  contactsController.getContactById
);

// POST a new contact
router.post('/', 
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  contactsController.createContact
);

// PUT (update) a contact by ID
router.put('/:id', 
  param('id').isMongoId().withMessage('Invalid contact ID'), // Validate ID
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  contactsController.updateContact
);

// DELETE a contact by ID
router.delete('/:id', 
  param('id').isMongoId().withMessage('Invalid contact ID'), // Validate ID
  contactsController.deleteContact
);

module.exports = router;