const {Client}=require('pg');
const bcrypt=require('bcryptjs');
const fs=require('node:fs');
const path=require('node:path');
const {S3Client,PutObjectCommand,ListObjectsV2Command,DeleteObjectsCommand}=require('@aws-sdk/client-s3');
function guard(){
 const name=new URL(process.env.DATABASE_URL).pathname.slice(1);
 if(process.env.DEMO_MODE!=='true'||!/^novanest_demo_[a-f0-9]+$/.test(name)||!/^nova-nest-demo-\d+-[a-f0-9]+$/.test(process.env.S3_BUCKET_NAME)||process.env.S3_FOLDER!=='demo')throw new Error('Demo isolation check failed');
 if(!process.env.DEMO_ADMIN_PASSWORD)throw new Error('Demo password missing');
}
exports.verifyIsolation=async()=>{
 guard();
 const url=new URL(process.env.DATABASE_URL);url.pathname='/neondb';
 const client=new Client({connectionString:url.toString(),connectionTimeoutMillis:15000});
 try{
  await client.connect();
  await client.query('SELECT id FROM public.users LIMIT 0');
  throw new Error('UNSAFE_PRODUCTION_TABLE_ACCESS');
 }catch(error){if(error.code==='42501')return {ok:true,productionAccessDenied:true};throw error;}
 finally{await client.end();}
};
exports.reset=async({initialize=false}={})=>{
 guard();
 const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:20000});await db.connect();
 try{
  if(initialize){
   await db.query('CREATE TABLE IF NOT EXISTS pgmigrations(id serial PRIMARY KEY,name varchar(255) NOT NULL,run_on timestamp NOT NULL)');
   for(const file of fs.readdirSync(path.join(__dirname,'migrations')).filter(f=>f.endsWith('.sql')).sort()){
    const name=file.slice(0,-4);
    if(!(await db.query('SELECT 1 FROM pgmigrations WHERE name=$1',[name])).rowCount){await db.query(fs.readFileSync(path.join(__dirname,'migrations',file),'utf8').split('-- Down Migration')[0]);await db.query('INSERT INTO pgmigrations(name,run_on) VALUES($1,now())',[name]);}
   }
  }
  await db.query('BEGIN');
  await db.query('TRUNCATE integration_lead_dedupe,source_mapping_overrides,source_column_registry,lead_duplicates,lead_activities,leads,lead_import_batches,agents,users CASCADE');
  const hash=await bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD,10);
  const accounts=[['demo.admin','Demo Administrator','admin',[]],['demo.magicbricks','MagicBricks Caller','telecaller',['magicbricks']],['demo.housing','Housing + Custom Caller','telecaller',['housing','website','personal']],['demo.99acres','99acres Caller','telecaller',['99acres']],['demo.team','Demo Team Member','agent',[]]];
  let teamUser,admin;
  for(const [username,name,role,scope]of accounts){const {rows}=await db.query('INSERT INTO users(email,username,name,role,password_hash,source_scope) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[username+'@example.invalid',username,name,role,hash,scope]);if(role==='admin')admin=rows[0].id;if(role==='agent')teamUser=rows[0].id;}
  const agents=[];
  for(const [i,name]of ['Demo Team Member','Demo Priya','Demo Arjun'].entries()){agents.push((await db.query('INSERT INTO agents(name,name_normalized,email,user_id) VALUES($1,$2,$3,$4) RETURNING id',[name,name.toLowerCase(),`demo.team${i}@example.invalid`,i===0?teamUser:null])).rows[0].id);}
  const sources=['magicbricks','housing','99acres','website','personal'];
  const statuses=['new','contacted','follow_up','site_visit_scheduled','site_visit_done','negotiation','converted','closed_lost'];
  const names=['Aarav','Diya','Ishaan','Meera','Kabir','Ananya','Vihaan','Saanvi','Reyansh','Aisha'];
  for(let i=0;i<60;i++){
   const status=statuses[i%statuses.length];const date=new Date(Date.now()-(i%28)*86400000).toISOString();
   const due=['follow_up','site_visit_scheduled','contacted'].includes(status)?new Date(Date.now()+((i%5)-2)*86400000).toISOString():null;
   const {rows}=await db.query(`INSERT INTO leads(source,name,name_normalized,phone,phone_raw,email,project_name,city,locality,configuration,listing_type,property_type,price_value,status,agent_id,lead_date,next_follow_up_at,message,notes,converted_at,deal_value,lost_reason,created_at) VALUES($1,$2,$3,$4,$4,$5,$6,'Bengaluru',$7,$8,$9,'Apartment',$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$13) RETURNING id`,[sources[i%5],`Demo ${names[i%10]} ${i+1}`,`demo ${names[i%10].toLowerCase()} ${i+1}`,i%13===0?null:String(9000000100+i),`demo.lead${i+1}@example.invalid`,['Demo Green Heights','Demo Lakeview','Demo Urban Nest'][i%3],['Whitefield','Bellandur','Marathahalli'][i%3],`${2+i%3} BHK`,i%2?'rent':'sale',i%2?35000+i*100:8500000+i*50000,status,i%4===0?null:agents[i%3],date,due,'Sample enquiry for demonstration. No real customer.', 'Synthetic sample record. Calls and messages are simulated.',status==='converted'?date:null,status==='converted'?9000000:null,status==='closed_lost'?'Demo: budget mismatch':null]);
   await db.query("INSERT INTO lead_activities(lead_id,type,content,created_by) VALUES($1,'note',$2,$3)",[rows[0].id,'Demo lead added for exploring the CRM workflow.',admin]);
  }
  await db.query('COMMIT');
  const s3=new S3Client({region:process.env.S3_REGION});
  let token;
  do{const list=await s3.send(new ListObjectsV2Command({Bucket:process.env.S3_BUCKET_NAME,Prefix:'demo/',ContinuationToken:token}));if(list.Contents?.length)await s3.send(new DeleteObjectsCommand({Bucket:process.env.S3_BUCKET_NAME,Delete:{Objects:list.Contents.map(o=>({Key:o.Key}))}}));token=list.NextContinuationToken;}while(token);
  const now=new Date().toISOString();
  const properties=Array.from({length:12},(_,i)=>({id:`demo-property-${i+1}`,title:`Demo ${['Green Heights Apartment','Lakeview Family Home','Urban Nest Residence'][i%3]} ${i+1}`,price:i%2?32000+i*1500:8500000+i*250000,location:['Whitefield, Bengaluru','Bellandur, Bengaluru','Marathahalli, Bengaluru'][i%3],locality:['Whitefield','Bellandur','Marathahalli'][i%3],description:'A fictional property for this interactive client demo. Explore enquiries, property management, sharing and billing using sample data only.',images:[`assets/demo-home-${i%3}.png`],videos:[],category:i%3===1?'villa':'apartment',status:i%2?'rent':'buy',bedrooms:2+i%3,bathrooms:2,areaSqft:1200+i*80,amenities:['Parking','Security','Gym','Swimming Pool'],featured:i<6,verified:true,isActive:true,isDummy:true,furnished:i%2===0,createdAt:now,updatedAt:now,latitude:12.9716,longitude:77.5946}));
  const collections={'properties.json':properties,'leads.json':[],'invoices/documents.json':[],'invoices/bills.json':[]};
  for(const [key,value]of Object.entries(collections))await s3.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET_NAME,Key:'demo/'+key,Body:JSON.stringify(value),ContentType:'application/json',ServerSideEncryption:'AES256',CacheControl:'no-store'}));
  for(let i=0;i<3;i++)await s3.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET_NAME,Key:`demo/assets/demo-home-${i}.png`,Body:fs.readFileSync(path.join(__dirname,'demo-media',`demo-home-${i}.png`)),ContentType:'image/png',ServerSideEncryption:'AES256'}));
  return {ok:true,leads:60,properties:12,accounts:5};
 }finally{await db.end();}
};
