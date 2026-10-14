import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const directory=path.join(root,'.demo/media');fs.mkdirSync(directory,{recursive:true});
const photos=['1600585154340-be6161a56a0c','1564013799919-ab600027ffc6','1600607687920-4e2a09cf159d','1600566753190-17f0baa2a6c3','1600047509807-ba8f99d2cdde','1600210492486-724fe5c67fb0'];
const results=await Promise.allSettled(photos.map(async(id,index)=>{
 const url=`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85&fm=jpg`;
 const response=await fetch(url);if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw new Error(`Photo ${index} unavailable`);
 fs.writeFileSync(path.join(directory,`demo-home-${index}.jpg`),Buffer.from(await response.arrayBuffer()));
 return index;
}));
for(const result of results){if(result.status==='rejected'){console.error(result.reason.message);process.exitCode=1;}else console.log(`Sample property photo ${result.value+1} downloaded.`);}
fs.writeFileSync(path.join(root,'.demo/photo-sources.json'),JSON.stringify({license:'https://unsplash.com/license',photos:photos.map(id=>`https://images.unsplash.com/photo-${id}`)},null,2));
