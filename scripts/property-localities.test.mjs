import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
function load(file) {
  const exports={};
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(source,{exports,require:relative=>load(path.resolve(path.dirname(file),relative+'.ts'))});
  return exports;
}
const {getDistinctLocalities}=load(path.resolve('src/utils/propertyLocalities.ts'));
const listing=(values={})=>({locality:'Hoodi',location:'Hoodi, Bengaluru',images:[],...values});
test('localities with no active properties are absent, including archived rows',()=>{
  assert.equal(getDistinctLocalities([listing({isActive:false}),listing({archivedAt:'2026-01-01'})]).length,0);
});
test('deactivating the last listing removes its locality instead of leaving an empty filter',()=>{
  const rows=[listing(),listing({locality:'Whitefield'})];
  assert.equal(getDistinctLocalities(rows).length,2);rows[0].isActive=false;
  assert.equal(getDistinctLocalities(rows).length,1);assert.equal(getDistinctLocalities(rows)[0].name,'Whitefield');
});
test('a later active listing supplies the cover when the first has a placeholder',()=>{
  const [group]=getDistinctLocalities([listing({images:['/assets/no-image-abc.png']}),listing({images:['/assets/actual-home.jpg']})]);
  assert.equal(group.count,2);assert.equal(group.coverImage,'/assets/actual-home.jpg');
});
test('other available property photos are retained as ordered fallback candidates',()=>{
  const [group]=getDistinctLocalities([listing({images:['/a.jpg','/b.jpg']}),listing({images:['/a.jpg','/c.jpg']})]);
  assert.equal(Array.from(group.coverImages).join(','),'/a.jpg,/b.jpg,/c.jpg');
});
test('inactive property photos cannot become an active locality cover',()=>{
  const [group]=getDistinctLocalities([listing({images:['/hidden.jpg'],isActive:false}),listing()]);
  assert.equal(group.coverImage,'');assert.equal(group.count,1);
});
test('locality names normalize without creating hardcoded empty areas',()=>{
  const groups=getDistinctLocalities([listing({locality:' hoodi '}),listing({locality:'HOODI'})]);
  assert.equal(groups.length,1);assert.equal(groups[0].count,2);
});
