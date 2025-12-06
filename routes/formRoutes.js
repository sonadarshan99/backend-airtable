const express = require('express');
const mongoose = require('mongoose');
const Form = require('../models/Form');
const User = require('../models/User');
const { createClient } = require('../utils/airtableClient');
const router = express.Router();


async function requireUser(req, res, next) {
  try {
    const uid = req.cookies?.userId;
    if (!uid) return res.status(401).json({ error: 'Login required' });

    req.user = await User.findById(uid);
    if (!req.user) return res.status(401).json({ error: 'Invalid user' });

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


router.post('/', requireUser, async (req, res) => {
  try {
    const { title, airtableBaseId, airtableTableId, questions } = req.body;
    
    const f = await Form.create({
      owner: req.user._id,
      title,
      airtableBaseId,
      airtableTableId,
      questions
    });
    res.json(f);
  } catch (e) {
    console.error("Create Form Error:", e);
    res.status(500).json({ error: 'Failed to create form' });
  }
});


router.get('/', requireUser, async (req, res) => {
  try {
    const forms = await Form.find({ owner: req.user._id })
                            .select('title airtableBaseId airtableTableId createdAt')
                            .sort({ createdAt: -1 });
    res.json(forms);
  } catch (e) {
    console.error("Get Forms Error:", e);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});
router.get('/airtable/bases', requireUser, async (req, res) => {
  try {
    if (!req.user.accessToken) return res.status(401).json({ error: 'Airtable not connected' });
    
    const client = createClient(req.user.accessToken);
    const r = await client.get('/v0/meta/bases');
    res.json(r.data.bases || []); 
  } catch (e) {
    console.error("Airtable Bases Error:", e.response?.data || e.message);
    res.status(500).send('Failed to fetch Airtable bases');
  }
});


router.get('/airtable/bases/:baseId/tables', requireUser, async (req, res) => {
  try {
    const client = createClient(req.user.accessToken);
    const r = await client.get(`/v0/meta/bases/${req.params.baseId}/tables`);
    res.json(r.data.tables || []);
  } catch (e) {
    console.error("Airtable Tables Error:", e.response?.data || e.message);
    res.status(500).send('Failed to fetch Airtable tables');
  }
});


router.get('/airtable/bases/:baseId/tables/:tableId/fields', requireUser, async (req, res) => {
  try {
    const client = createClient(req.user.accessToken);
    
    const r = await client.get(`/v0/meta/bases/${req.params.baseId}/tables`);
    
    const table = r.data.tables.find(t => t.id === req.params.tableId);
    
    if (!table) {
        return res.status(404).send('Table not found in Airtable');
    }
    res.json(table.fields || []);
  } catch (e) {
    console.error("Airtable Fields Error:", e.response?.data || e.message);
    res.status(500).send('Failed to fetch Airtable fields');
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send('Invalid Form ID');
    }

    const f = await Form.findById(req.params.id);
    if (!f) return res.status(404).send('Form not found');
    res.json(f);
  } catch (e) {
    console.error("Get Form By ID Error:", e);
    res.status(500).send('Server Error');
  }
});

module.exports = router;