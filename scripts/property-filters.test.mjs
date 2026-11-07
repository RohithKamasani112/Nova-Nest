import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterInventory } from '../src/utils/managePropertyFilters.ts';
const defaults = { searchTerm: '', statusFilter: 'all', visibilityFilter: 'all', categoryFilter: 'all', bhkFilter: 'all', localityFilter: 'all', areaMin: '', areaMax: '' };
const rows = [
  { id: 'a', title: 'Home A', location: 'Whitefield Road', locality: 'Whitefield', status: 'rent', bedrooms: 2, areaSqft: 1200, category: 'apartment' },
  { id: 'b', title: 'Home B', location: 'Hoodi', status: 'buy', bedrooms: 3, areaSqft: 1800, category: 'villa', isActive: false },
  { id: 'c', title: 'Home C', location: 'Whitefield', locality: 'Whitefield', status: 'rent', bedrooms: 3, areaSqft: 1500, category: 'apartment', isActive: true },
];
const run = options => filterInventory(rows, { ...defaults, ...options }).map(p => p.id);
test('sale and rent counts reflect matching inventory', () => { assert.equal(run({statusFilter: 'rent'}).length, 2); assert.equal(run({statusFilter: 'buy'}).length, 1); });
test('BHK is exact rather than a minimum', () => assert.deepEqual(run({bhkFilter: '2'}), ['a']));
test('locality, BHK, size, status and visibility compose', () => assert.deepEqual(run({localityFilter: 'Whitefield', bhkFilter: '3', areaMin: '1400', areaMax: '1600', statusFilter: 'rent', visibilityFilter: 'active'}), ['c']));
test('legacy address fallback and inclusive size limits', () => assert.deepEqual(run({localityFilter: 'Hoodi', areaMin: '1800', areaMax: '1800'}), ['b']));
test('inactive listings and default-active legacy listings', () => { assert.deepEqual(run({visibilityFilter: 'inactive'}), ['b']); assert.deepEqual(run({visibilityFilter: 'active'}), ['a', 'c']); });
test('clear filters restores full inventory without mutating it', () => { assert.deepEqual(run({}), ['a', 'b', 'c']); assert.equal(rows.length, 3); });
test('nonmatching combinations return zero', () => assert.deepEqual(run({statusFilter: 'buy', bhkFilter: '2'}), []));

test('archived records are excluded from normal inventory and can be listed explicitly', () => {
  const archived = { ...rows[0], id:'archived', archivedAt:'2026-01-01', isActive:false };
  assert.equal(filterInventory([...rows,archived],defaults).length,3);
  assert.deepEqual(filterInventory([...rows,archived],{...defaults,visibilityFilter:'archived'}).map(p=>p.id),['archived']);
});
