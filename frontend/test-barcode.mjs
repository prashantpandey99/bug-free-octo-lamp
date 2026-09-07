import { resolveBarcodeProduct, evaluateRule6Declarations } from './src/services/barcodeService.js';

async function runTests() {
  console.log('================================================================');
  console.log('   LEGAL METROLOGY REAL-TIME BARCODE & STATUTORY SCANNER TEST   ');
  console.log('================================================================\n');

  // Test 1: Indian EAN-13 FMCG Product
  console.log('[TEST 1] Testing Indian FMCG Barcode (8901030865421 - Shakti Bhog Atta)');
  const res1 = await resolveBarcodeProduct('8901030865421');
  console.log(`  > Found: ${res1.found}`);
  console.log(`  > Source: ${res1.source}`);
  console.log(`  > Product: ${res1.product.product_name}`);
  console.log(`  > Brand: ${res1.product.brand}`);
  console.log(`  > Net Quantity: ${res1.product.net_quantity}`);
  console.log(`  > MRP: ${res1.product.mrp}`);
  console.log(`  > Rule 6 Declarations Count: ${res1.declarations.length} / 9`);
  console.log(`  > Compliance Score: ${res1.compliance_summary.score}%`);
  const missing1 = res1.declarations.filter(d => d.status === 'MISSING').length;
  console.log(`  > Present Count: ${res1.compliance_summary.present_count} | Missing Count: ${missing1}`);
  if (res1.found && res1.declarations.length === 9) {
    console.log('  >>> RESULT: PASS\n');
  } else {
    throw new Error('Test 1 failed');
  }

  // Test 2: Global EAN-13 Product (Open Food Facts v2)
  console.log('[TEST 2] Testing Global EAN-13 Barcode via Open Food Facts v2 (5449000000996 - Coca Cola)');
  const res2 = await resolveBarcodeProduct('5449000000996');
  console.log(`  > Found: ${res2.found}`);
  console.log(`  > Source: ${res2.source}`);
  console.log(`  > Product: ${res2.product.product_name}`);
  console.log(`  > Declarations Checked: ${res2.declarations.length}`);
  res2.declarations.forEach(d => {
    console.log(`    - [${d.icon}] ${d.field}: ${d.value}`);
  });
  if (res2.found && res2.source.includes('Open Food Facts')) {
    console.log('  >>> RESULT: PASS\n');
  } else {
    throw new Error('Test 2 failed');
  }

  // Test 3: UPC-A Product (UPCitemdb API Fallback)
  console.log('[TEST 3] Testing UPC-A Barcode via UPCitemdb API (011122233344 - Knit Dress)');
  const res3 = await resolveBarcodeProduct('011122233344');
  console.log(`  > Found: ${res3.found}`);
  console.log(`  > Source: ${res3.source}`);
  console.log(`  > Product: ${res3.product.product_name}`);
  if (res3.found && res3.source.includes('UPCitemdb')) {
    console.log('  >>> RESULT: PASS\n');
  } else {
    throw new Error('Test 3 failed');
  }

  // Test 4: Unmapped Barcode Graceful Error Handling
  console.log('[TEST 4] Testing Unmapped Barcode Error Handling (8900000000001)');
  const res4 = await resolveBarcodeProduct('8900000000001');
  console.log(`  > Found: ${res4.found}`);
  console.log(`  > Expected Message: "Product not found in database. Please verify label manually as per Legal Metrology Rules."`);
  console.log(`  > Actual Message: "${res4.message}"`);
  const expectedMsg = "Product not found in database. Please verify label manually as per Legal Metrology Rules.";
  if (res4.found === false && res4.message === expectedMsg) {
    console.log('  >>> RESULT: PASS\n');
  } else {
    throw new Error(`Test 4 failed: unexpected message "${res4.message}"`);
  }

  // Test 5: Verify all 9 mandatory Rule 6 declarations are generated
  console.log('[TEST 5] Verifying 9 Mandatory Legal Metrology Rule 6 Declarations');
  const decls = evaluateRule6Declarations({
    product_name: "Test Commodity",
    brand: "Test Brand",
    mrp: 100,
    mrp_declaration_text: "MRP Rs. 100 (inclusive of all taxes)",
    net_quantity: "500 g",
    manufacturer_name: "ABC Foods",
    manufacturer_address: "123 Industrial Area, Delhi - 110001",
    country_of_origin: "India",
    manufacturing_date: "01/2026",
    expiry_date: "12/2026",
    consumer_care: "1800-00-1111 | care@abc.in"
  });
  console.log(`  > Total Rule 6 Declarations: ${decls.length}`);
  const requiredFields = [
    "Product Name",
    "Brand",
    "MRP (incl. all taxes)",
    "Net Quantity",
    "Manufacturer Name & Address",
    "Country of Origin",
    "Month & Year of Manufacture/Packing/Import",
    "Best Before / Expiry Date",
    "Consumer Helpline Number"
  ];
  requiredFields.forEach(req => {
    const found = decls.find(d => d.field === req);
    if (found) {
      console.log(`    ✓ ${req}: ${found.icon}`);
    } else {
      throw new Error(`Missing required field: ${req}`);
    }
  });
  console.log('  >>> RESULT: PASS\n');

  console.log('=== ALL 5 BARCODE SCANNER TEST SUITES PASSED PERFECTLY ===');
}

runTests().catch(err => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
