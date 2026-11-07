import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPropertySearch, writePropertySearch, matchesBhk, filterRangeError, categoryFromForm } from '../src/utils/propertySearchState.ts';
import { normalizeIndianPhone } from '../src/utils/contactValidation.ts';
test('search URLs round-trip combined filters, sort, search text and pagination', () => {
  const filters = { status:'rent', locality:['HSR Layout','Hoodi'], bedrooms:[2,5], priceMin:0, priceMax:50000, verified:true, category:['apartment'], areaMin:1000 };
  const query = writePropertySearch(filters, 'Corner home', 'price-asc', 3);
  assert.deepEqual(readPropertySearch(query), { filters, query:'Corner home', sort:'price-asc', page:3 });
});
test('invalid URL values cannot set negative ranges, unknown categories or invalid sorting', () => {
  const next=readPropertySearch('?status=no&sort=oops&priceMin=-3&priceMax=NaN&category=unknown&page=-2');
  assert.deepEqual(next.filters, {category:[]}); assert.equal(next.sort,'newest'); assert.equal(next.page,1);
});
test('BHK is exact with a dedicated 5+ group', () => { assert.equal(matchesBhk(3,[2]),false); assert.equal(matchesBhk(2,[2]),true); assert.equal(matchesBhk(7,[5]),true); });
test('price and area ranges validate with zero boundaries', () => { assert.equal(filterRangeError({priceMin:0,priceMax:0}), ''); assert.match(filterRangeError({areaMin:20,areaMax:10}), /Minimum size/); });
test('Indian phone validation handles common formatting and rejects placeholders or extra digits', () => {
  for (const value of ['9876543210','+91 98765 43210','09876543210']) assert.equal(normalizeIndianPhone(value),'9876543210');
  for (const value of ['Via Call','1234567890','999999999999999','abc9876543210','']) assert.equal(normalizeIndianPhone(value),null);
});

test('commercial and townhouse forms preserve their stored categories', () => {
  assert.equal(categoryFromForm('Commercial Office'),'condo'); assert.equal(categoryFromForm('Warehouse'),'condo'); assert.equal(categoryFromForm('Townhouse'),'townhouse');
});
