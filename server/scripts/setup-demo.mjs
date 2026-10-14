import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import archiver from 'archiver';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const region='ap-south-1';
const stateDir=path.join(root,'.demo');fs.mkdirSync(stateDir,{recursive:true,mode:0o700});
const stateFile=path.join(stateDir,'state.json');
const state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{suffix:crypto.randomBytes(4).toString('hex')};
const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2),{mode:0o600});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'novanest-demo-'));
const file=(name,value)=>{const p=path.join(tmp,name);fs.writeFileSync(p,JSON.stringify(value),{mode:0o600});return 'file://'+p;};
function aws(args){try{const r=execFileSync('aws',[...args,'--region',region,'--no-cli-pager','--output','json'],{stdio:['ignore','pipe','pipe'],maxBuffer:10*1024*1024}).toString().trim();return r?JSON.parse(r):{};}catch(e){throw new Error(`AWS ${args[0]} ${args[1]} failed: ${(e.stderr?.toString()||'').replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[DATABASE_URL]').replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,'[KEY]').slice(0,400)}`);}}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function zip(source,target){await new Promise((resolve,reject)=>{const out=fs.createWriteStream(target,{mode:0o600});const a=archiver('zip',{zlib:{level:6}});out.on('close',resolve);a.on('error',reject);a.pipe(out);a.directory(source,false);a.finalize();});}
async function main(){
 const identity=aws(['sts','get-caller-identity']);
 if(identity.Account!=='974954696514')throw new Error('Unexpected AWS account');
 const prod=aws(['lambda','get-function-configuration','--function-name','nova-nest-crm-backend']);
 state.functionName??='nova-nest-client-demo';state.roleName??='nova-nest-client-demo-role';save();
 if(!state.roleArn){const r=aws(['iam','create-role','--role-name',state.roleName,'--assume-role-policy-document',file('trust.json',{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Service:'lambda.amazonaws.com'},Action:'sts:AssumeRole'}]}),'--tags','Key=Environment,Value=client-demo']);state.roleArn=r.Role.Arn;save();aws(['iam','attach-role-policy','--role-name',state.roleName,'--policy-arn','arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole']);await pause(10000);}
 const pkg=path.join(tmp,'package');fs.mkdirSync(pkg);
 for(const name of ['package.json','package-lock.json'])fs.copyFileSync(path.join(root,'server',name),path.join(pkg,name));
 console.log('Packaging isolated demo backend');
 execFileSync('npm',['ci','--omit=dev','--ignore-scripts'],{cwd:pkg,stdio:['ignore','pipe','pipe'],maxBuffer:10*1024*1024});
 fs.copyFileSync(path.join(root,'server/scripts/demo-bootstrap.cjs'),path.join(pkg,'bootstrap.cjs'));
 fs.cpSync(path.join(root,'server/dist'),path.join(pkg,'dist'),{recursive:true,filter:p=>!path.relative(path.join(root,'server/dist'),p).split(path.sep).includes('test')});
 fs.cpSync(path.join(root,'server/src/db/migrations'),path.join(pkg,'migrations'),{recursive:true});
 const archive=path.join(tmp,'backend.zip');await zip(pkg,archive);
 if(!state.functionCreated){aws(['lambda','create-function','--function-name',state.functionName,'--runtime','nodejs22.x','--role',state.roleArn,'--handler','bootstrap.handler','--timeout','120','--memory-size','512','--zip-file','fileb://'+archive,'--environment',file('bootstrap-env.json',{Variables:{BOOTSTRAP_DATABASE_URL:prod.Environment.Variables.DATABASE_URL}}),'--tags','Environment=client-demo']);state.functionCreated=true;save();aws(['lambda','wait','function-active-v2','--function-name',state.functionName]);}
 if(!state.databaseCreated){
  aws(['lambda','update-function-code','--function-name',state.functionName,'--zip-file','fileb://'+archive]);aws(['lambda','wait','function-updated-v2','--function-name',state.functionName]);
  const output=path.join(tmp,'invoke.json');aws(['lambda','invoke','--function-name',state.functionName,'--payload',file('inspect.json',{action:'inspect'}),'--cli-binary-format','raw-in-base64-out',output]);const inspected=JSON.parse(fs.readFileSync(output));console.log('Database provisioning check:',JSON.stringify(inspected));if(inspected.error)throw new Error('Database inspection failed: '+inspected.error);
  state.database??='novanest_demo_'+state.suffix;state.dbRole??='novanest_demo_'+state.suffix;state.dbPassword??=crypto.randomBytes(32).toString('hex');save();
  aws(['lambda','invoke','--function-name',state.functionName,'--payload',file('create.json',{action:'create',database:state.database,role:state.dbRole,password:state.dbPassword}),'--cli-binary-format','raw-in-base64-out',output]);const created=JSON.parse(fs.readFileSync(output));if(!created.created)throw new Error('Demo database provisioning failed: '+created.error+' '+created.detail);
  const db=new URL(prod.Environment.Variables.DATABASE_URL);db.username=state.dbRole;db.password=state.dbPassword;db.pathname='/'+state.database;state.databaseUrl=db.toString();state.databaseCreated=true;save();console.log('Separate demo database and restricted login created.');
 }
 console.log('Demo bootstrap complete; state kept in private ignored .demo folder.');
}
try{await main();}catch(e){console.error(e.message);process.exitCode=1;}finally{fs.rmSync(tmp,{recursive:true,force:true});}
