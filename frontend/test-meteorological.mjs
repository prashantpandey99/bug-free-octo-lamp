import { searchMeteorologicalProduct, METEOROLOGICAL_CATALOG } from './src/services/meteorologicalService.js';

console.log('================================================================');
console.log('   METEOROLOGICAL PRODUCTS BARCODE SCANNER TEST SUITE           ');
console.log('================================================================\n');

const testCases = [
  { barcode: "1001", expectedName: "Rain Gauge", expectedCat: "Precipitation", expectedStock: 45, expectedLoc: "Warehouse A" },
  { barcode: "1002", expectedName: "Anemometer", expectedCat: "Wind Speed", expectedStock: 12, expectedLoc: "Warehouse B" },
  { barcode: "1003", expectedName: "Barograph", expectedCat: "Pressure", expectedStock: 8, expectedLoc: "Lab Store" },
  { barcode: "1004", expectedName: "Thermometer", expectedCat: "Temperature", expectedStock: 30, expectedLoc: "Warehouse A" },
  { barcode: "1005", expectedName: "Hygrometer", expectedCat: "Humidity", expectedStock: 22, expectedLoc: "Warehouse C" },
];

let allPassed = true;

for (const tc of testCases) {
  const res = searchMeteorologicalProduct(tc.barcode);
  if (!res.found || !res.product) {
    console.error(`❌ [FAIL] Barcode ${tc.barcode} not found!`);
    allPassed = false;
    continue;
  }

  const p = res.product;
  const nameOk = p.name === tc.expectedName;
  const catOk = p.category === tc.expectedCat;
  const stockOk = p.stock === tc.expectedStock;
  const locOk = p.location === tc.expectedLoc;

  if (nameOk && catOk && stockOk && locOk) {
    console.log(`✓ [PASS] Barcode ${tc.barcode} -> Name: "${p.name}", Category: "${p.category}", Stock: ${p.stock}, Location: "${p.location}"`);
  } else {
    console.error(`❌ [FAIL] Data mismatch for ${tc.barcode}:`, { p, tc });
    allPassed = false;
  }
}

// Test Invalid Barcode
console.log('\nTesting Invalid Barcodes:');
const invalidRes = searchMeteorologicalProduct("9999");
if (!invalidRes.found && invalidRes.product === null) {
  console.log(`✓ [PASS] Barcode 9999 gracefully returned not found: "${invalidRes.message}"`);
} else {
  console.error(`❌ [FAIL] Barcode 9999 should not have been found!`);
  allPassed = false;
}

const emptyRes = searchMeteorologicalProduct("   ");
if (!emptyRes.found && emptyRes.product === null) {
  console.log(`✓ [PASS] Blank barcode gracefully handled: "${emptyRes.message}"`);
} else {
  console.error(`❌ [FAIL] Blank barcode should not have been found!`);
  allPassed = false;
}

// Test padded / 14-char barcode auto-detect simulation (e.g. 00000000001001)
console.log('\nTesting Padded / Long Barcode Auto-Detection:');
const paddedRes = searchMeteorologicalProduct("00000000001001");
if (paddedRes.found && paddedRes.product?.name === "Rain Gauge") {
  console.log(`✓ [PASS] Padded barcode "00000000001001" resolved to "Rain Gauge"`);
} else {
  console.error(`❌ [FAIL] Padded barcode resolution failed:`, paddedRes);
  allPassed = false;
}

if (!allPassed) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n================================================================');
  console.log('   ALL METEOROLOGICAL BARCODE TESTS PASSED SUCCESSFULLY!       ');
  console.log('================================================================\n');
}
