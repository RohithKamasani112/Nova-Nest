import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');const state=JSON.parse(fs.readFileSync(path.join(root,'.demo/state.json'),'utf8'));
if(state.functionName!=='nova-nest-client-demo')throw new Error('Demo environment required');
async function api(route,options={}){const r=await fetch(state.apiUrl+route,options);if(!r.ok)throw new Error(`Demo API ${route}: ${r.status}`);return r.status===204?null:r.json();}
const login=await api('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'demo.admin',password:state.password})});
const headers={'Content-Type':'application/json',Authorization:'Bearer '+login.token};
for(let i=0;i<6;i++){
 const bytes=fs.readFileSync(path.join(root,'.demo/media',`demo-home-${i}.jpg`));
 const upload=await api('/storage/upload',{method:'POST',headers,body:JSON.stringify({path:`assets/demo-home-${i}.jpg`,contentType:'image/jpeg',size:bytes.length})});
 const form=new FormData();for(const [key,value]of Object.entries(upload.fields))form.append(key,value);form.append('file',new Blob([bytes],{type:'image/jpeg'}),`demo-home-${i}.jpg`);
 const r=await fetch(upload.url,{method:'POST',body:form});if(!r.ok)throw new Error('Demo photo upload failed');
}
const document=await api('/storage/object?path=properties.json',{headers});const properties=JSON.parse(document.content);
for(const [i,property]of properties.entries())if(property.id.startsWith('demo-property-'))property.images=[i%6,(i+2)%6,(i+4)%6].map(index=>`assets/demo-home-${index}.jpg`);
await api('/storage/object',{method:'PUT',headers,body:JSON.stringify({path:'properties.json',content:JSON.stringify(properties),contentType:'application/json'})});
console.log('Demo property photo galleries updated; leads and other records retained.');
