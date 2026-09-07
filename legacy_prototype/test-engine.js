const fs = require('fs');

// Mock browser window/document globals
global.window = {};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => []
};

// Load rule engine and samples
const ruleEngineCode = fs.readFileSync('scripts/rule-engine.js', 'utf8');
const sampleDataCode = fs.readFileSync('scripts/sample-data.js', 'utf8');

eval(ruleEngineCode);
eval(sampleDataCode);

const engine = new window.LegalMetrologyRuleEngine();

console.log('================================================================');
console.log(' LEGAL METROLOGY (PACKAGED COMMODITIES) RULES 2011 - TEST RUN ');
console.log('================================================================\n');

let passCount = 0;

window.SAMPLE_PRODUCTS.forEach((prod, i) => {
  const evalData = {
    productName: prod.productName,
    brand: prod.brand,
    rawText: prod.rawText,
    pdpAreaSqCm: prod.pdpAreaSqCm || 200,
    actualFontHeightMm: prod.actualFontHeightMm || 3.5
  };
  const result = engine.evaluateCompliance(evalData);

  console.log(`[TEST CASE ${i + 1}] ${prod.productName} (${prod.category})`);
  console.log(`  > Expected Status: ${prod.expectedStatus} | Actual Evaluated: ${result.overallStatus}`);
  console.log(`  > Compliance Score: ${result.complianceScore}%`);
  console.log(`  > Violations Detected: ${result.violationsCount} | Passed Rules: ${result.passedCount}`);
  console.log(`  > Statutory Action: ${result.penaltyDetails.actionTitle} (Fine: Rs. ${result.penaltyDetails.firstOffenseFine})`);

  if (result.violationsCount > 0) {
    console.log('  > Violation Details:');
    result.rulesResults.filter(r => r.status === 'FAIL').forEach(f => {
      console.log(`    - [${f.ruleCode}] ${f.title}: ${f.message}`);
    });
  }

  if (result.overallStatus === prod.expectedStatus) {
    console.log('  >>> RESULT: PASS [Status Matches Expected]');
    passCount++;
  } else {
    console.log('  >>> RESULT: MISMATCH');
  }
  console.log('----------------------------------------------------------------\n');
});

console.log(`=== TEST SUMMARY: ${passCount} / ${window.SAMPLE_PRODUCTS.length} TEST CASES PASSED ===`);
