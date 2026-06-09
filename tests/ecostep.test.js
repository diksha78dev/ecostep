import assert from 'assert';
import { CONSTANTS, PLEDGES } from '../js/config.js';

// Simple unit tests for core logic
console.log('🧪 Running EcoStep Unit Tests...');

try {
  // 1. Test Constants
  assert.strictEqual(CONSTANTS.MODEL, 'gemini-2.5-flash', 'Model should be gemini-2.5-flash');
  assert.strictEqual(CONSTANTS.MAX_INPUT_LEN, 500, 'Max input length should be 500');

  // 2. Test Pledges logic
  assert.ok(Array.isArray(PLEDGES), 'PLEDGES should be an array');
  assert.ok(PLEDGES.length > 0, 'Should have predefined pledges');
  
  const totalSavings = PLEDGES.reduce((sum, p) => sum + p.saving, 0);
  assert.ok(totalSavings > 0, 'Pledges should have valid savings values');

  console.log('✅ All tests passed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
