import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessSql, crmIdentity, enquiryAccessSql, PORTAL_SOURCES, visibleSources } from '../lib/crmAccess';

test('Housing and Custom are independent lead sources', () => {
  assert.deepEqual(PORTAL_SOURCES.housing, ['housing']);
  assert.deepEqual(PORTAL_SOURCES.custom, ['website', 'personal']);
  assert.deepEqual(Object.keys(PORTAL_SOURCES).sort(), ['99acres', 'custom', 'housing', 'magicbricks']);
});

test('multi-source access includes all historical leads and uses the current scope after a transfer', () => {
  const identity = { id: 'caller', email: 'caller@test.invalid', role: 'telecaller', source_scope: ['housing', 'magicbricks'], agent_id: null, session_version: 0 };
  crmIdentity.run(identity, () => {
    const values: unknown[] = ['contacted'];
    assert.equal(accessSql(values, 'l'), 'l.source::text = ANY($2::text[])');
    assert.deepEqual(values[1], ['housing', 'magicbricks']);
    assert.deepEqual(visibleSources(), ['housing', 'magicbricks']);
    const enquiryValues: unknown[] = [];
    assert.equal(enquiryAccessSql(enquiryValues), 'ld.incoming_source::text = ANY($1::text[])');
    assert.deepEqual(enquiryValues[0], ['housing', 'magicbricks']);
  });
  crmIdentity.run({ ...identity, source_scope: ['magicbricks'] }, () => {
    assert.deepEqual(visibleSources(), ['magicbricks']);
    const values: unknown[] = [];
    accessSql(values);
    assert.deepEqual(values, [['magicbricks']]);
  });
  crmIdentity.run({ ...identity, source_scope: [] }, () => {
    assert.equal(accessSql([]), 'FALSE');
    assert.deepEqual(visibleSources(), []);
  });
});
