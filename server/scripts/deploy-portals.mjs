// Update the existing production portal stack, reviewing replacements first.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const region='ap-south-1',stackName='nova-nest-magicbricks';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'novanest-portals-'));
const secrets=new Set();
const redact=value=>{let text=String(value);for(const secret of secrets)if(secret)text=text.split(secret).join('[PRIVATE]');return text.replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[DATABASE_URL]');};
function aws(args){try{const text=execFileSync('aws',[...args,'--region',region,'--output','json','--no-cli-pager'],{stdio:['ignore','pipe','pipe'],maxBuffer:10*1024*1024}).toString().trim();return text?JSON.parse(text):{};}catch(e){throw new Error(`AWS ${args[0]} ${args[1]} failed: ${redact(e.stderr?.toString()||'').slice(0,600)}`);}}
try{
 if(aws(['sts','get-caller-identity']).Account!=='974954696514')throw new Error('Unexpected AWS account');
 const stack=aws(['cloudformation','describe-stacks','--stack-name',stackName]).Stacks[0];
 if(!['UPDATE_COMPLETE','CREATE_COMPLETE'].includes(stack.StackStatus))throw new Error('Stack not ready for update');
 const outputs=Object.fromEntries(stack.Outputs.map(o=>[o.OutputKey,o.OutputValue]));
 const params=Object.fromEntries(stack.Parameters.map(p=>[p.ParameterKey,p.ParameterValue]));
 const current=aws(['lambda','get-function-configuration','--function-name',outputs.FunctionName]);
 const main=aws(['lambda','get-function-configuration','--function-name','nova-nest-crm-backend']);
 const database=JSON.parse(aws(['secretsmanager','get-secret-value','--secret-id',params.DatabaseSecretArn]).SecretString).DATABASE_URL;
 for(const url of [database,current.Environment.Variables.DATABASE_URL,main.Environment.Variables.DATABASE_URL])secrets.add(url);
 if(database!==current.Environment.Variables.DATABASE_URL||database!==main.Environment.Variables.DATABASE_URL)throw new Error('Database secret and live CRM/portal database URLs differ. Resolve rotated database configuration before deployment.');
 if(new URL(database).pathname.includes('demo'))throw new Error('Production deployment cannot target demo database');
 execFileSync('npm',['run','package:portals'],{cwd:root,stdio:'inherit'});
 const created=Date.now();
 const samArgs=['deploy','--template-file','infra/magicbricks.yaml','--stack-name',stackName,'--region',region,'--capabilities','CAPABILITY_IAM','--resolve-s3','--s3-prefix',stackName,'--no-execute-changeset','--no-confirm-changeset','--no-fail-on-empty-changeset','--parameter-overrides',...Object.entries(params).filter(([,value])=>value!=='').map(([name,value])=>`${name}=${value}`)];
 // SAM output contains resource identifiers, not secret values.
 execFileSync('sam',samArgs,{cwd:root,stdio:'inherit',env:{...process.env,SAM_CLI_TELEMETRY:'0'}});
 const sets=aws(['cloudformation','list-change-sets','--stack-name',stackName]).Summaries.filter(s=>new Date(s.CreationTime).getTime()>=created-2000&&s.Status==='CREATE_COMPLETE').sort((a,b)=>new Date(b.CreationTime)-new Date(a.CreationTime));
 if(!sets.length)throw new Error('No new executable change set found');
 const reviewed=aws(['cloudformation','describe-change-set','--change-set-name',sets[0].ChangeSetId]);
 for(const change of reviewed.Changes){const r=change.ResourceChange;if(r.Action==='Remove'||(r.Action==='Modify'&&r.Replacement!=='False'))throw new Error('Unsafe removal/replacement in change set: '+r.LogicalResourceId);console.log('Reviewed:',r.Action,r.LogicalResourceId,r.Replacement||'');}
 aws(['cloudformation','execute-change-set','--change-set-name',sets[0].ChangeSetId]);
 console.log('Updating the existing production portal stack.');
 aws(['cloudformation','wait','stack-update-complete','--stack-name',stackName]);
 const updated=aws(['cloudformation','describe-stacks','--stack-name',stackName]).Stacks[0];
 const result=Object.fromEntries(updated.Outputs.map(o=>[o.OutputKey,o.OutputValue]));
 if(result.FunctionName!==outputs.FunctionName||result.Endpoint!==outputs.Endpoint)throw new Error('Existing endpoint/function changed unexpectedly');
 const config=aws(['lambda','get-function-configuration','--function-name',result.FunctionName]);
 for(const name of ['MAGICBRICKS_API_KEY_SECRET_ARN','HOUSING_API_KEY_SECRET_ARN'])if(config.Environment.Variables[name]!==current.Environment.Variables[name])throw new Error('Existing portal key changed unexpectedly');
 const key=JSON.parse(aws(['secretsmanager','get-secret-value','--secret-id',result.Acres99ApiKeySecretArn]).SecretString).active;secrets.add(key);
 const missing=await fetch(result.Acres99Endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(missing.status!==401)throw new Error('Missing-key check failed');
 const validation=await fetch(result.Acres99Endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key},body:JSON.stringify({name:'Integration validation',projectName:'No database write'})});if(validation.status!==400)throw new Error('Valid-key validation check failed');
 for(const endpoint of [result.Endpoint,result.HousingEndpoint,result.MagicbricksEndpoint]){const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(r.status!==401)throw new Error('Existing route regression check failed');}
 console.log('Production 99acres route deployed. Authentication/validation and existing route smoke checks passed. No test lead was inserted.');
 console.log(JSON.stringify({endpoint:result.Acres99Endpoint,keySecretArn:result.Acres99ApiKeySecretArn,functionName:result.FunctionName},null,2));
}catch(e){console.error(redact(e.message));process.exitCode=1;}finally{fs.rmSync(temp,{recursive:true,force:true});}
