// controllers/contacts.js
const mongodb = require('../db/connect');
const { ObjectId, MongoError } = require('mongodb');
const { validationResult } = require('express-validator'); // Import validationResult

// Get all contacts
const getAllContacts = async (req, res) => {
  try {
    const result = await mongodb.getDb().collection('contacts').find().toArray();
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ message: 'Internal server error while fetching contacts.' });
  }
};

// Get a contact by ID
const getContactById = async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);
    const result = await mongodb.getDb().collection('contacts').findOne({ _id: userId });
    if (!result) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof MongoError) {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }
    console.error('Error fetching contact by ID:', err);
    res.status(500).json({ message: 'Internal server error while fetching contact.' });
  }
};

// Create a new contact
const createContact = async (req, res) => {
  const errors = validationResult(req); // Check for validation errors
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Return validation errors
  }

  const { firstName, lastName, email, favoriteColor, birthday } = req.body;

  try {
    const contact = { firstName, lastName, email, favoriteColor, birthday };
    const response = await mongodb.getDb().collection('contacts').insertOne(contact);
    if (response.acknowledged) {
      res.status(201).json(response);
    } else {
      res.status(500).json({ message: 'Error creating contact.' });
    }
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ message: 'Internal server error while creating contact.' });
  }
};

// Update a contact by ID
const updateContact = async (req, res) => {
  const errors = validationResult(req); // Check for validation errors
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Return validation errors
  }

  const userId = req.params.id;
  const { firstName, lastName, email, favoriteColor, birthday } = req.body;

  try {
    const updatedContact = {};
    if (firstName) updatedContact.firstName = firstName;
    if (lastName) updatedContact.lastName = lastName;
    if (email) updatedContact.email = email;
    if (favoriteColor) updatedContact.favoriteColor = favoriteColor;
    if (birthday) updatedContact.birthday = birthday;

    const response = await mongodb.getDb().collection('contacts').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updatedContact }
    );

    if (response.modifiedCount === 0) {
      return res.status(404).json({ message: 'Contact not found or no changes made.' });
    }
    res.status(200).json({ message: 'Contact updated successfully.' });
  } catch (err) {
    if (err instanceof MongoError) {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }
    console.error('Error updating contact:', err);
    res.status(500).json({ message: 'Internal server error while updating contact.' });
  }
};

// Delete a contact by ID
const deleteContact = async (req, res) => {
  const userId = req.params.id;

  try {
    const response = await mongodb.getDb().collection('contacts').deleteOne({ _id: new ObjectId(userId) });
    if (response.deletedCount === 0) {
      return res.status(404).json({ message: 'Contact not found.' });
    }
    res.status(200).json({ message: 'Contact deleted successfully.' });
  } catch (err) {
    if (err instanceof MongoError) {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }
    console.error('Error deleting contact:', err);
    res.status(500).json({ message: 'Internal server error while deleting contact.' });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact
};