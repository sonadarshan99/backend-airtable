const mongoose = require('mongoose');
const ResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  airtableRecordId: String,
  answers: mongoose.Schema.Types.Mixed,
  deletedInAirtable: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Response', ResponseSchema);
