const mongoose = require('mongoose');
const ConditionSchema = new mongoose.Schema({
  questionKey: String,
  operator: String,
  value: mongoose.Schema.Types.Mixed
}, { _id: false });

const RulesSchema = new mongoose.Schema({
  logic: { type: String, enum: ['AND','OR'], default: 'AND' },
  conditions: [ConditionSchema]
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  questionKey: String,
  airtableFieldId: String,
  label: String,
  type: String,
  required: Boolean,
  options: [String],
  conditionalRules: { type: RulesSchema, default: null }
}, { _id: false });

const FormSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  airtableBaseId: String,
  airtableTableId: String,
  questions: [QuestionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Form', FormSchema);
