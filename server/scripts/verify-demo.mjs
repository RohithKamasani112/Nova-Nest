import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const state=JSON.parse(fs.readFileSync(path.join(root,'.demo/state.json'),'utf8'));
if(state.functionName!=='nova-nest-client-demo'||!state.database.startsWith('novanest_demo_'))throw new Error('Wrong environment');
async function call(route,{token,method='GET',body,status=200}={}){
 const r=await fetch(state.apiUrl+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
 assert.equal(r.status,status,`${method} ${route}: HTTP ${r.status}`);
 return r.status===204?null:r.json();
}
const tokens={};
for(const name of ['admin','magicbricks','housing','99acres','team'])tokens[name]=(await call('/auth/login',{method:'POST',body:{email:'demo.'+name,password:state.password}})).token;
const properties=await call('/public/storage/properties');assert.equal(properties.length,12);assert(properties.every(p=>p.title.startsWith('Demo ')));
await call('/storage/object?path=properties.json',{status:401});await call('/storage/object?path=properties.json',{token:tokens.team,status:403});
const all=await call('/crm/leads',{token:tokens.admin});assert(all.total>=60);
for(const name of ['magicbricks','housing','99acres']){const list=await call('/crm/leads',{token:tokens[name]});const allowed=name==='housing'?['housing','website','personal']:[name];assert(list.leads.every(l=>allowed.includes(l.source)));}
const lead=all.leads[0];await call('/crm/leads/'+lead.id,{token:tokens.admin,method:'PATCH',body:{name:'Demo Edited Contact',phone:'+91 90000 00999',status:'site_visit_scheduled',nextFollowUpAt:new Date(Date.now()+86400000).toISOString()}});
const changed=await call('/crm/leads/'+lead.id,{token:tokens.admin});assert.equal(changed.lead.phone,'9000000999');assert.equal(changed.lead.name,'Demo Edited Contact');
await call('/crm/leads/'+lead.id,{token:tokens.admin,method:'PATCH',body:{phone:'bad-number'},status:400});
const website=await call('/public/leads',{method:'POST',status:201,body:{name:'Demo Website Check',phone:'9000000998',email:'demo.website-check@example.invalid',message:'Synthetic verification only',project:'Demo Test Project'}});assert(website.id);
const media=fs.readFileSync(path.join(root,'.demo/media/demo-home-0.png'));const upload=await call('/storage/upload',{token:tokens.admin,method:'POST',body:{path:'assets/demo-verification.png',contentType:'image/png',size:media.length}});const form=new FormData();for(const [k,v]of Object.entries(upload.fields))form.append(k,v);form.append('file',new Blob([media],{type:'image/png'}),'demo-verification.png');const uploaded=await fetch(upload.url,{method:'POST',body:form});assert.equal(uploaded.status,204);
const asset=await fetch(state.apiUrl+'/public/storage/asset?path=assets/demo-verification.png');assert.equal(asset.status,200);assert.equal(asset.headers.get('content-type'),'image/png');
const raw=await fetch(`https://${state.bucket}.s3.ap-south-1.amazonaws.com/demo/properties.json`);assert.equal(raw.status,403);
const cors=await fetch(state.apiUrl+'/public/storage/properties',{headers:{Origin:state.url}});assert.equal(cors.headers.get('access-control-allow-origin'),state.url);
console.log('PASS: five demo logins, public listings, source permissions, private storage, contact edits, site visits, website capture, signed upload/download, S3 privacy and CORS.');
