import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createHandler } from '../integrations/acres99/handler';
import { NormalizedLead, PushEvent } from '../integrations/shared/types';
const key = randomBytes(32).toString('hex');
const fields = { Name: ' Test Buyer ', email: 'TEST@example.com', phone: '+91 98765-43210', projectName: 'Test Project', price: '85 lakh', bedroomNum: 3 };
function setup() {
  const leads: NormalizedLead[] = [];
  const handler = createHandler({ keys: async () => [key], log: () => {}, repository: { save: async lead => {
    if (leads.some(l => l.mobile === lead.mobile && l.project.toLowerCase() === lead.project.toLowerCase())) return 'duplicate';
    leads.push(lead); return 'created';
  } } });
  const request = (body: object = fields, override: Partial<PushEvent> = {}) => handler({rawPath:'/api/leads/create/99acres',httpMethod:'POST',headers:{'content-type':'application/json','x-api-key':key},body:JSON.stringify(body),...override});
  return {leads, request};
}
test('99acres maps name, normalized phone, price, bedrooms and forced source', async () => {
  const {leads,request}=setup();const r=await request({...fields,source:'housing'});
  assert.equal(r.statusCode,200);assert.equal(JSON.parse(r.body).status,'success');
  assert.equal(leads[0].source,'99acres');assert.equal(leads[0].mobile,'9876543210');
  assert.equal(leads[0].price_value,8500000);assert.equal(leads[0].price_raw,'85 lakh');
  assert.equal(leads[0].bedrooms,3);assert.equal(leads[0].configuration,'3 BHK');assert.equal(leads[0].email,'test@example.com');
});
test('99acres accepts missing optional fields and spaced/underscore labels', async () => {
  const {leads,request}=setup();assert.equal((await request({name:'Buyer',phone:'9876543210','project name':'Project','price of the property':6500000})).statusCode,200);
  assert.equal(leads[0].email,null);assert.equal(leads[0].bedrooms,null);assert.equal(leads[0].price_value,6500000);
  assert.equal((await setup().request({name:'Buyer',phone:'9876543210',project_name:'Project',bedroom_num:2})).statusCode,200);
});
test('99acres header/query/body authentication and form data; invalid priority is rejected', async () => {
  for(const override of [{}, {headers:{'content-type':'application/json'},rawQueryString:'api_key='+key}, {headers:{'content-type':'application/json'},body:JSON.stringify({...fields,api_key:key})}, {headers:{'content-type':'application/x-www-form-urlencoded','x-api-key':key},body:new URLSearchParams({name:'Buyer',phone:'9876543210',projectName:'Project',bedroomNum:'2',price:'8000000'}).toString()}])assert.equal((await setup().request(fields,override)).statusCode,200);
  for(const headers of [{}, {'x-api-key':'wrong'}, {'x-api-key':'wrong','content-type':'application/json'}])assert.equal((await setup().request(fields,{headers,rawQueryString:headers['x-api-key']?'api_key='+key:undefined})).statusCode,401);
});
test('99acres rejects missing/invalid phone and malformed numeric fields without saving', async () => {
  for(const body of [{...fields,phone:''},{...fields,phone:'abc'},{...fields,price:'unknown'},{...fields,bedroomNum:'two'},{...fields,bedroomNum:3.5},{...fields,price:1e20}]){const {leads,request}=setup();assert.equal((await request(body)).statusCode,400);assert.equal(leads.length,0);}
});
test('99acres retry returns the exact duplicate response and unsupported method is rejected', async () => {
  const {leads,request}=setup();await request();const r=await request({...fields,phone:'9876543210',projectName:'TEST PROJECT'});
  assert.deepEqual(JSON.parse(r.body),{status:'failure',message:'Lead already exist'});assert.equal(leads.length,1);
  assert.equal((await request(fields,{httpMethod:'GET'})).statusCode,404);
});
