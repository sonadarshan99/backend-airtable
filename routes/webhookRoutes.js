const express = require('express');
const Form = require('../models/Form');
const Response = require('../models/Response');
const router = express.Router();

router.post('/airtable', express.json({ limit: '2mb' }), async (req,res) => {
  try{
    const secret = process.env.WEBHOOK_SECRET;
    if(secret){
      const incoming = req.headers['x-webhook-secret'] || req.headers['x-airtable-signature'] || req.headers['x-secret'];
      if(!incoming || incoming !== secret) return res.status(401).send('invalid secret');
    }
    const payloads = req.body.payloads || (req.body.notifications ? req.body.notifications : [req.body]);
    for(const p of payloads){
      const baseId = p.baseId || (p.payload && p.payload.baseId);
      const tableId = p.tableId || (p.payload && p.payload.tableId);
      const recordId = p.recordId || (p.payload && p.payload.recordId);
      const eventType = p.eventType || (p.payload && p.payload.eventType);
      const fieldsAfter = (p.payload && p.payload.fieldsAfter) || p.fieldsAfter || (p.payload && p.payload.fields_after) || p.fields_after;

      if(!baseId || !tableId || !recordId) continue;
      const forms = await Form.find({ airtableBaseId: baseId, airtableTableId: tableId });
      for(const f of forms){
        const resp = await Response.findOne({ airtableRecordId: recordId, formId: f._id });
        if(eventType && (eventType.includes('deleted') || eventType === 'record.deleted')){
          if(resp){ resp.deletedInAirtable = true; await resp.save(); }
          continue;
        }

        const mapped = {};
        for(const q of f.questions){
          const key = q.airtableFieldId || q.questionKey || q.label;
          mapped[q.questionKey] = (fieldsAfter && (fieldsAfter[key] ?? fieldsAfter[q.label])) ?? null;
        }
        if(resp){
          resp.answers = { ...resp.answers, ...mapped };
          resp.deletedInAirtable = false;
          resp.updatedAt = new Date();
          await resp.save();
        } else {
          await Response.create({ formId: f._id, airtableRecordId: recordId, answers: mapped });
        }
      }
    }

    return res.status(200).send('ok');
  } catch(e){
    console.error('webhook error', e);
    return res.status(500).send('error');
  }
});

module.exports = router;
