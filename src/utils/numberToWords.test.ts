// Node runs this file directly (native TS support, no bundler) — the
// explicit .ts extension is required for Node's ESM resolver; Vite/webpack
// never import this test file, so it's harmless there.
import { numberToWordsIndian, amountInWords } from './numberToWords.ts';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, actual: string, expected: string) {
  if (actual === expected) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    failed++;
    failures.push(`${label} — expected "${expected}", got "${actual}"`);
    console.log(`  \x1b[31m✗\x1b[0m ${label} — expected "${expected}", got "${actual}"`);
  }
}

// ------------------------------------------------- numberToWordsIndian ---

check('zero', numberToWordsIndian(0), 'Zero');
check('single digit', numberToWordsIndian(7), 'Seven');
check('teen', numberToWordsIndian(15), 'Fifteen');
check('two digit round ten', numberToWordsIndian(40), 'Forty');
check('two digit compound', numberToWordsIndian(42), 'Forty Two');
check('hundred exact', numberToWordsIndian(100), 'One Hundred');
check('hundred compound', numberToWordsIndian(742), 'Seven Hundred Forty Two');
check('thousand exact', numberToWordsIndian(1000), 'One Thousand');

// The critical case from the spec: Indian grouping, not Western.
check('1,35,000 -> lakh grouping, not "hundred thousand"', numberToWordsIndian(135_000), 'One Lakh Thirty Five Thousand');
check('99,999', numberToWordsIndian(99_999), 'Ninety Nine Thousand Nine Hundred Ninety Nine');
check('one lakh exact', numberToWordsIndian(1_00_000), 'One Lakh');
check('lakh + thousand + hundreds', numberToWordsIndian(4_56_789), 'Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine');
check('ten lakh', numberToWordsIndian(10_00_000), 'Ten Lakh');
check('one crore exact', numberToWordsIndian(1_00_00_000), 'One Crore');
check(
  'crore + lakh + thousand + hundreds',
  numberToWordsIndian(1_23_45_678),
  'One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight'
);
check('rounds down fractional input', numberToWordsIndian(135_000.9), 'One Lakh Thirty Five Thousand');
check('negative treated as magnitude', numberToWordsIndian(-500), 'Five Hundred');

// ---------------------------------------------------------- amountInWords ---

check('zero amount', amountInWords(0), 'Rupees Zero Only');
check('whole rupees only', amountInWords(135_000), 'Rupees One Lakh Thirty Five Thousand Only');
check('booking amount example from spec', amountInWords(135_000), 'Rupees One Lakh Thirty Five Thousand Only');
check('paise only, no rupees', amountInWords(0.75), 'Rupees Seventy Five Paise Only');
check('rupees and paise combined', amountInWords(1500.5), 'Rupees One Thousand Five Hundred and Fifty Paise Only');
check('single paisa (singular-looking but "Paise" kept per convention)', amountInWords(0.01), 'Rupees One Paise Only');
check('rounds fractional paise correctly (1500.554 -> 1500.55)', amountInWords(1500.554), 'Rupees One Thousand Five Hundred and Fifty Five Paise Only');
check('large sale consideration', amountInWords(85_00_000), 'Rupees Eighty Five Lakh Only');
check('floating point safety (0.1 + 0.2 style amount)', amountInWords(1000.3), 'Rupees One Thousand and Thirty Paise Only');

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  console.log('Failures:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
