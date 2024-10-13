// controllers/contacts.js
const mongodb = require('../db/connect');
const ObjectId = require('mongodb').ObjectId;

// Get all contacts
const getAllContacts = async (req, res) => {
  try {
    const result = await mongodb.getDb().collection('contacts').find().toArray();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    if (err instanceof ObjectId.BSONTypeError) {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Create a new contact
const createContact = async (req, res) => {
  const { firstName, lastName, email, favoriteColor, birthday } = req.body;

  // Basic validation
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: 'First name, last name, and email are required.' });
  }

  try {
    const contact = { firstName, lastName, email, favoriteColor, birthday };
    const response = await mongodb.getDb().collection('contacts').insertOne(contact);
    if (response.acknowledged) {
      res.status(201).json(response);
    } else {
      res.status(500).json({ message: 'Error creating contact.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact
};