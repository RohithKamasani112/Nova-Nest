import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');const state=JSON.parse(fs.readFileSync(path.join(root,'.demo/state.json'),'utf8'));
if(state.functionName!=='nova-nest-client-demo')throw new Error('Demo function required');
const action=process.argv[2];if(!['reset','verify-isolation','status'].includes(action))throw new Error('Use reset, verify-isolation or status');
const aws=args=>JSON.parse(execFileSync('aws',[...args,'--region','ap-south-1','--no-cli-pager','--output','json'],{stdio:['ignore','pipe','pipe']}).toString());
if(action==='status')console.log(aws(['amplify','get-job','--app-id',state.appId,'--branch-name','demo','--job-id',state.jobId]).job.summary.status);
else{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'novanest-demo-check-'));try{
 const payload=path.join(temp,'event.json'),output=path.join(temp,'output.json');fs.writeFileSync(payload,JSON.stringify({source:'novanest.demo.reset',action}),{mode:0o600});
 aws(['lambda','invoke','--function-name',state.functionName,'--payload','file://'+payload,'--cli-binary-format','raw-in-base64-out',output]);
 const result=JSON.parse(fs.readFileSync(output));if(!result.ok)throw new Error('Demo operation failed: '+(result.errorType||result.error||'unknown'));console.log(JSON.stringify(result));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
