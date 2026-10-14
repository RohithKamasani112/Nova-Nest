// IAM-invoked one-time provisioner. Never attach a public URL to this handler.
const pg = require('pg');
exports.handler = async event => {
  if(event.action==='initialize') {
    try{return await require('./demo-data.cjs').reset({initialize:true});}
    catch(error){return {error:error.code||error.message};}
  }
  const client = new pg.Client({ connectionString: process.env.BOOTSTRAP_DATABASE_URL, connectionTimeoutMillis: 20000 });
  try {
    await client.connect();
    if (event.action === 'inspect') return { permissions: (await client.query('SELECT rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user')).rows[0] };
    if (event.action !== 'create' || !/^novanest_demo_[a-z0-9_]+$/.test(event.database) || !/^novanest_demo_[a-z0-9_]+$/.test(event.role) || !/^[a-f0-9]{64}$/.test(event.password)) throw new Error('INVALID_DEMO_PROVISIONING');
    if ((await client.query('SELECT 1 FROM pg_database WHERE datname=$1',[event.database])).rowCount) throw new Error('DEMO_DATABASE_ALREADY_EXISTS');
    if (!(await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[event.role])).rowCount) await client.query(`CREATE ROLE ${event.role} LOGIN PASSWORD '${event.password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`);
    await client.query(`GRANT ${event.role} TO CURRENT_USER`);
    await client.query(`CREATE DATABASE ${event.database} OWNER ${event.role}`);
    const url = new URL(process.env.BOOTSTRAP_DATABASE_URL);
    url.pathname = '/' + event.database;
    const owner = new pg.Client({connectionString:url.toString(),connectionTimeoutMillis:20000});
    await owner.connect();
    await owner.query(`REVOKE ALL ON DATABASE ${event.database} FROM PUBLIC`);
    await owner.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    await owner.query(`GRANT ALL ON SCHEMA public TO ${event.role}`);
    await owner.end();
    return {created:true};
  } catch(error) { return {error:error.code || 'BOOTSTRAP_FAILED', detail:error.message?.replace(/postgres(?:ql)?:\/\/\S+/g,'[DATABASE_URL]')}; }
  finally { await client.end(); }
};
