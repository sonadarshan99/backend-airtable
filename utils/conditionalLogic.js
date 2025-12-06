function evaluateCondition(cond, answers){
  const left = answers?.[cond.questionKey];
  const right = cond.value;
  if(cond.operator === 'equals') return left === right;
  if(cond.operator === 'notEquals') return left !== right;
  if(cond.operator === 'contains'){
    if(Array.isArray(left)) return left.includes(right);
    if(typeof left === 'string' && right != null) return String(left).includes(String(right));
    return false;
  }
  return false;
}
function shouldShowQuestion(rules, answers){
  if(!rules) return true;
  const results = (rules.conditions || []).map(c=> {
    try { return evaluateCondition(c, answers); } catch(e) { return false; }
  });
  return rules.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

module.exports = { shouldShowQuestion };
