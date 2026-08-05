import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { detectFormat } from '../parsers/formatDetect';
import { parseFile, SanityGateError } from '../parsers/parseFile';
import { dedupeWithinFile } from '../lib/dedupe';
import { normalizePhone, normalizePrice, normalizeDate } from '../lib/valueNormalize';

const SAMPLE_DIR = path.resolve(__dirname, '../../../sample_files');

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    failed++;
    failures.push(label + (detail ? ` — ${detail}` : ''));
    console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function istDateParts(d: Date): { day: number; month: number; year: number; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return {
    day: Number(parts.day),
    month: Number(parts.month),
    year: Number(parts.year),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

// ------------------------------------------------------------- Housing ---

console.log('\n== Housing (real file, actually TSV) ==');
{
  const buf = fs.readFileSync(path.join(SAMPLE_DIR, 'leads_data (7).xls'));
  const detection = detectFormat(buf);
  check('detected as tsv', detection.format === 'tsv', `got ${detection.format}`);

  const result = parseFile(buf, 'housing');
  check('18 headers detected', result.headers.length === 18, `got ${result.headers.length}`);
  check('rows read = 43', result.rows.length === 43, `got ${result.rows.length}`);

  const row1 = result.rows[0].lead;
  check('row1 name = Reyansh', row1.name === 'Reyansh', `got ${row1.name}`);
  check('row1 phone normalized to 8112239954', row1.phone === '8112239954', `got ${row1.phone}, raw=${row1.phoneRaw}`);
  check('row1 listingType = rent', row1.listingType === 'rent', `got ${row1.listingType}`);
  check('row1 propertyType = Apartment', row1.propertyType === 'Apartment', `got ${row1.propertyType}`);
  check('row1 configuration = 2 BHK, bedrooms = 2', row1.configuration === '2 BHK' && row1.bedrooms === 2, `got ${row1.configuration}/${row1.bedrooms}`);
  check('row1 priceValue = 62000 (62.0k)', row1.priceValue === 62000, `got ${row1.priceValue}`);
  check('row1 email correct', row1.email === 'reyansh7447@gmail.com', `got ${row1.email}`);

  if (row1.leadDate) {
    const p = istDateParts(row1.leadDate);
    check('row1 lead_date = 23 July 2026 (DD/MM/YYYY, not month-flipped)', p.day === 23 && p.month === 7 && p.year === 2026, `got ${JSON.stringify(p)}`);
  } else {
    check('row1 lead_date parsed', false, 'lead_date is null');
  }
}

// ------------------------------------------------------------- 99acres ---

console.log('\n== 99acres (real file, real CSV) ==');
{
  const buf = fs.readFileSync(path.join(SAMPLE_DIR, 'responses_RAJESHA B S_1785394492116.csv'));
  const detection = detectFormat(buf);
  check('detected as csv', detection.format === 'csv', `got ${detection.format}`);

  const result = parseFile(buf, '99acres');
  check('16 headers detected', result.headers.length === 16, `got ${result.headers.length}`);
  check('rows read = 1203', result.rows.length === 1203, `got ${result.rows.length}`);

  const row1 = result.rows[0].lead;
  check('row1 name = K Suneetha', row1.name === 'K Suneetha', `got ${row1.name}`);
  check('row1 phone normalized to 9494067670', row1.phone === '9494067670', `got ${row1.phone}, raw=${row1.phoneRaw}`);
  check('row1 priceValue = 90000 (Rs90,000)', row1.priceValue === 90000, `got ${row1.priceValue}`);
  check('row1 configuration = 3 BHK, bedrooms = 3', row1.configuration === '3 BHK' && row1.bedrooms === 3, `got ${row1.configuration}/${row1.bedrooms}`);
  check('row1 listingType = rent (Res Rent)', row1.listingType === 'rent', `got ${row1.listingType}`);
  check('row1 "Assigned To" mapped to agent_name = RAJESHA B S', row1.agentNameRaw === 'RAJESHA B S', `got ${row1.agentNameRaw}`);
  check('row1 email placeholder "-" treated as NULL', row1.email === null, `got ${row1.email}`);

  if (row1.leadDate) {
    const p = istDateParts(row1.leadDate);
    check('row1 lead_date = 30 July 2026 10:59 (MM/DD/YYYY, not month-flipped)', p.day === 30 && p.month === 7 && p.year === 2026 && p.hour === 10 && p.minute === 59, `got ${JSON.stringify(p)}`);
  } else {
    check('row1 lead_date parsed', false, 'lead_date is null');
  }

  // Same file uploaded "twice" == identical row set; in-file dedupe rules
  // are exactly the DB dedupe rules, so pairing every row with itself
  // should collapse 1:1 (each row is its own group) while genuine repeat
  // phone numbers *within* the file should collapse into groups > 1.
  const rows = result.rows.map((r) => ({ rowNumber: r.rowNumber, lead: r.lead }));
  const dedupe = dedupeWithinFile(rows, '99acres');
  const dupedGroups = dedupe.duplicates.length;
  check('in-file dedupe finds at least one repeat-phone group in 1202 real rows', dupedGroups > 0, `found ${dupedGroups} duplicate rows`);
}

// -------------------------------------------------- Value normalizers ---

console.log('\n== Value normalizers (spec §4 examples) ==');
{
  check('(+91)-8112239954 -> 8112239954', normalizePhone('(+91)-8112239954').phone === '8112239954');
  check('91-9494067670 -> 9494067670', normalizePhone('91-9494067670').phone === '9494067670');
  check('08077781257 -> 8077781257', normalizePhone('08077781257').phone === '8077781257');
  check('+91 98765 43210 -> 9876543210', normalizePhone('+91 98765 43210').phone === '9876543210');

  check('62.0k -> 62000', normalizePrice('62.0k').priceValue === 62000);
  check('Rs90,000 -> 90000', normalizePrice('Rs90,000').priceValue === 90000);
  check('Rs1.05 Crore -> 10500000', normalizePrice('Rs1.05 Crore').priceValue === 10500000);

  const d1 = normalizeDate('23/07/2026', 'housing');
  check('Housing 23/07/2026 -> 23 July', !!d1.leadDate && istDateParts(d1.leadDate).day === 23 && istDateParts(d1.leadDate).month === 7);

  const d2 = normalizeDate('07/30/2026 10:59', '99acres');
  check('99acres 07/30/2026 10:59 -> 30 July', !!d2.leadDate && istDateParts(d2.leadDate).day === 30 && istDateParts(d2.leadDate).month === 7);

  const d3 = normalizeDate('Jul 1, 2026 12:14:46 PM', 'magicbricks');
  check('MagicBricks "Jul 1, 2026 12:14:46 PM" parses', !!d3.leadDate);
}

// --------------------------------------------- MagicBricks (from spec) ---
// No real binary .xls sample is available yet (flagged to the user); this
// exercises the header-alias/derivation logic against the documented
// columns using a synthetic CSV, since our mapping/normalization code is
// format-agnostic once a sheet has been parsed into rows.

console.log('\n== MagicBricks (synthetic, per written spec — real .xls sample still missing) ==');
{
  const header = 'Sr. No.,Property Id,Brief Desc.,Name,Email,Email Vefification Status,Mobile,Mobile Vefification Status,Landline,Locality,City,State,Status,Type of Lead,Message Details,Plan To Buy,Contacted By,Message Date,Interested In,Budget,High Quality Lead,Nri contact mode,Nri local contact,Project Name,Project Listing,Agent';
  const row = '1,85207545,"2 BHK Multistorey Apartment For Rent in Marathahalli, Bangalore",aman,maan.amanmaan@gmail.com,Verified,08077781257,Verified,,Marathahalli,Bangalore,Karnataka,---,Domestic Lead,Interested,,,"Jul 1, 2026 12:14:46 PM",,,,,,Rekha Park Apartments,,Suresh Kumar';
  const buf = Buffer.from(`${header}\n${row}\n`, 'utf8');

  const result = parseFile(buf, 'magicbricks');
  check('25+ headers detected (26 incl. new Agent column)', result.headers.length === 26, `got ${result.headers.length}`);
  const lead = result.rows[0].lead;
  check('name = aman', lead.name === 'aman');
  check('phone normalized (leading zero) = 8077781257', lead.phone === '8077781257', `got ${lead.phone}`);
  check('misspelled "Vefification" columns fall through to raw_data, not crash', 'Email Vefification Status' in lead.rawData);
  check('agent_name resolved via alias "Agent" -> Suresh Kumar', lead.agentNameRaw === 'Suresh Kumar', `got ${lead.agentNameRaw}`);
  check('Brief Desc. fallback derives configuration = 2 BHK', lead.configuration === '2 BHK', `got ${lead.configuration}`);
  check('Brief Desc. fallback derives listingType = rent', lead.listingType === 'rent', `got ${lead.listingType}`);
  check('source_status = --- normalized to NULL (placeholder)', lead.sourceStatus === null, `got ${lead.sourceStatus}`);
}

// --------------------------------------------------------- New/dropped columns ---

console.log('\n== Dynamic columns: new column added / column dropped (acceptance #9, #10) ==');
{
  const withNewCol = Buffer.from(
    'Lead Name\tLead Phone Number\tLead Email\tLead Date\tLead Score\n' +
      'Priya\t9876543210\tpriya@test.com\t01/08/2026\t87\n',
    'utf8'
  );
  const r1 = parseFile(withNewCol, 'housing');
  check('unknown "Lead Score" column does not break import', r1.rows[0].error === null);
  check('unknown "Lead Score" column preserved in raw_data', r1.rows[0].lead.rawData['Lead Score'] === '87', `got ${JSON.stringify(r1.rows[0].lead.rawData)}`);

  const droppedCol = Buffer.from('Lead Name\tLead Phone Number\tLead Date\nRahul\t9876500000\t01/08/2026\n', 'utf8');
  const r2 = parseFile(droppedCol, 'housing');
  check('missing Lead Email column is non-fatal', r2.rows[0].error === null);
  check('email is NULL when column is absent entirely', r2.rows[0].lead.email === null);
}

// ------------------------------------------------------- Broken rows ---

console.log('\n== 5 deliberately broken rows (acceptance #11) ==');
{
  const csv = [
    'Lead Name,Lead Phone Number,Lead Email,Lead Date',
    'Good One,9876543210,good1@test.com,01/08/2026',
    ',9876543211,noname@test.com,01/08/2026', // MISSING_NAME
    'No Contact,,,01/08/2026', // MISSING_CONTACT
    'Bad Date,9876543212,bad@test.com,not-a-date', // unparsed date, still importable
    'Good Two,9876543213,,02/08/2026',
    'Good Three,,good3@test.com,03/08/2026',
  ].join('\n');
  const r = parseFile(Buffer.from(csv, 'utf8'), 'housing');
  const errors = r.rows.filter((row) => row.error !== null);
  check('exactly 2 rows fail hard validation (blank name / no contact)', errors.length === 2, `got ${errors.length}: ${errors.map((e) => e.error).join(', ')}`);
  const badDateRow = r.rows.find((row) => row.raw['Lead Name'] === 'Bad Date');
  check('garbage date imports with lead_date=NULL + warning, not rejected', !!badDateRow && badDateRow.error === null && badDateRow.lead.leadDate === null && badDateRow.lead.warnings.some((w) => w.code === 'UNPARSED_DATE'));
}

// ------------------------------------------------------ Unrelated file ---

console.log('\n== Unrelated file rejected at preview (acceptance #12) ==');
{
  const invoice = Buffer.from('Invoice Number,Total Due,Vendor\nINV-001,500,Acme Corp\n', 'utf8');
  try {
    parseFile(invoice, 'housing');
    check('unrelated file rejected via sanity gate', false, 'did not throw');
  } catch (err) {
    check('unrelated file rejected via sanity gate', err instanceof SanityGateError, String(err));
  }
}

// ------------------------------------------- Binary XLS/XLSX detection ---
// Both real sample files happen to be plain text (TSV/CSV) under a
// misleading extension, so the two actual binary code paths (legacy OLE2
// .xls via xlsx's BIFF8 reader, modern ZIP .xlsx) are otherwise untested.
// Round-trip through SheetJS's own writer to exercise both magic-byte
// branches end-to-end.

console.log('\n== Binary XLS/XLSX magic-byte detection + parsing ==');
{
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Lead Name', 'Lead Phone Number', 'Lead Email', 'Lead Date', 'Price'],
    ['Test User', '9876543210', 'test@test.com', '01/08/2026', '55.5k'],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const xlsxBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  check('xlsx magic bytes (PK..) detected as xlsx', detectFormat(xlsxBuf).format === 'xlsx');
  const xlsxResult = parseFile(xlsxBuf, 'housing');
  check('xlsx round-trip: name/phone/price parsed correctly', xlsxResult.rows[0].lead.name === 'Test User' && xlsxResult.rows[0].lead.phone === '9876543210' && xlsxResult.rows[0].lead.priceValue === 55500);

  const xlsBuf = XLSX.write(wb, { type: 'buffer', bookType: 'biff8' }) as Buffer;
  check('legacy xls magic bytes (D0CF11E0...) detected as xls', detectFormat(xlsBuf).format === 'xls');
  const xlsResult = parseFile(xlsBuf, 'housing');
  check('legacy xls round-trip: name/phone/price parsed correctly', xlsResult.rows[0].lead.name === 'Test User' && xlsResult.rows[0].lead.phone === '9876543210' && xlsResult.rows[0].lead.priceValue === 55500);
}

// ------------------------------------------------------------- Summary ---

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  console.log('Failures:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
