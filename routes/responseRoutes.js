const express = require('express');
const Form = require('../models/Form');
const Response = require('../models/Response');
const User = require('../models/User');
const { shouldShowQuestion } = require('../utils/conditionalLogic');
const { createClient } = require('../utils/airtableClient');
const router = express.Router();

router.post('/:formId/submit', async (req, res) => {
  try {
    const { formId } = req.params;
    const answers = req.body.answers || {};
    const form = await Form.findById(formId);
    if (!form) return res.status(404).send('form not found');

    for (const q of form.questions) {
      if (!shouldShowQuestion(q.conditionalRules, answers)) continue;
      const v = answers[q.questionKey];
      
      if (q.required && (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0))) {
        return res.status(400).json({ error: `Missing required ${q.questionKey}` });
      }
      
      if ((q.type === 'single_select' || q.type === 'multi_select') && q.options && q.options.length) {
        if (q.type === 'single_select' && v != null && !q.options.includes(v)) {
          return res.status(400).json({ error: 'invalid option' });
        }
        if (q.type === 'multi_select' && Array.isArray(v)) {
          for (const val of v) {
            if (!q.options.includes(val)) return res.status(400).json({ error: 'invalid option' });
          }
        }
      }
    }

    const owner = await User.findById(form.owner);
    if (!owner || !owner.accessToken) return res.status(500).json({ error: 'owner token missing' });

    const fields = {};
    for (const q of form.questions) {
      if (!shouldShowQuestion(q.conditionalRules, answers)) continue;
      const v = answers[q.questionKey];
      
      if (q.type === 'attachment') {
        if (!v) continue;
        fields[q.airtableFieldId || q.questionKey] = Array.isArray(v) ? v.map(u => ({ url: u })) : [{ url: v }];
      } else {
        fields[q.airtableFieldId || q.questionKey] = v === undefined ? "" : v;
      }
    }

    const client = createClient(owner.accessToken);
    const airtableTable = encodeURIComponent(form.airtableTableId);
    
    const createRes = await client.post(`/v0/${form.airtableBaseId}/${airtableTable}`, { fields });
    
    const airtableRecordId = createRes.data?.id || (createRes.data.records && createRes.data.records[0]?.id);

    const resp = await Response.create({
      formId: form._id,
      airtableRecordId,
      answers
    });

    res.json({ success: true, response: resp, airtable: createRes.data });

  } catch (e) {
    console.error('submit error', e.response?.data || e.message || e);
    res.status(500).json({ error: 'submit failed' });
  }
});

router.get('/:formId', async (req, res) => {
  const rows = await Response.find({ formId: req.params.formId }).sort({ createdAt: -1 }).lean();
  res.json(rows);
});

module.exports = router;