const { shouldShowQuestion } = require('../utils/conditionalLogic');
const rules = { logic: 'AND', conditions: [{ questionKey: 'role', operator: 'equals', value: 'Engineer' }]};
console.assert(shouldShowQuestion(null, {}) === true, 'null rules should show');
console.assert(shouldShowQuestion(rules, { role: 'Engineer' }) === true);
console.assert(shouldShowQuestion(rules, { role: 'Designer' }) === false);
console.log('conditional tests passed');
