import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import type { AddressInfo } from 'node:net';

test('CRM role access and shared lead workflow (isolated PostgreSQL)', { skip: !process.env.CRM_TEST_DATABASE_URL }, async t => {
  const schema = 'team_test_' + randomBytes(8).toString('hex');
  const adminDb = new Pool({ connectionString: process.env.CRM_TEST_DATABASE_URL });
  await adminDb.query('CREATE SCHEMA ' + schema);
  const database = new Pool({ connectionString: process.env.CRM_TEST_DATABASE_URL, options: '-c search_path=' + schema + ',public -c TimeZone=Asia/Kolkata' });
  let server: import('node:http').Server | undefined;
  try {
    for (const file of fs.readdirSync(path.resolve(__dirname, '../../src/db/migrations')).filter(name => name.endsWith('.sql')).sort()) {
      await database.query(fs.readFileSync(path.resolve(__dirname, '../../src/db/migrations', file), 'utf8').split('-- Down Migration')[0]);
    }
    process.env.DATABASE_URL = process.env.CRM_TEST_DATABASE_URL;
    process.env.JWT_SECRET = 'isolated-role-test-secret-do-not-use-in-production';
    process.env.S3_BUCKET_NAME = 'isolated-test-unused';
    // All application queries use this randomly named, disposable schema.
    const poolModule = require('../db/pool');
    const unusedPool = poolModule.pool;
    poolModule.pool = database;
    await unusedPool.end();
    const { app } = require('../app');
    const { signAuthToken } = require('../lib/jwt');
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server!.once('listening', resolve));
    const base = `http://127.0.0.1:${(server!.address() as AddressInfo).port}/api`;
    const password = 'Role-test-password-123';
    const hash = await bcrypt.hash(password, 4);
    const admin = (await database.query("INSERT INTO users (email,name,role,password_hash) VALUES ('admin@testing.invalid','Admin','admin',$1) RETURNING *", [hash])).rows[0];
    const adminToken = signAuthToken({ sub: admin.id, email: admin.email, role: admin.role, sessionVersion: 0 });
    const call = async (route: string, token = adminToken, method = 'GET', body?: unknown, status = 200) => {
      const response = await fetch(base + route, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      const text = await response.text();
      assert.equal(response.status, status, `${method} ${route}: ${text}`);
      return response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text;
    };
    const team = await call('/crm/agents', adminToken, 'POST', { name: 'Team One' }, 201);
    const otherTeam = await call('/crm/agents', adminToken, 'POST', { name: 'Team Two' }, 201);
    const createAccount = (username: string, role: string, extra: object) => call('/team-accounts', adminToken, 'PUT', { username, name: username, password, role, ...extra });
    const magicAccount = await createAccount('magic.calls', 'telecaller', { portal: 'magicbricks' });
    await createAccount('housing.calls', 'telecaller', { portal: 'housing' });
    await createAccount('acres.calls', 'telecaller', { portal: '99acres' });
    await createAccount('team.one', 'agent', { agentId: team.agent.id });
    await createAccount('team.two', 'agent', { agentId: otherTeam.agent.id });
    const tokens: Record<string, string> = {};
    for (const username of ['magic.calls', 'housing.calls', 'acres.calls', 'team.one', 'team.two']) {
      const result = await call('/auth/login', '', 'POST', { email: username, password });
      tokens[username] = result.token;
    }
    const leadIds: Record<string, string> = {};
    let index = 0;
    for (const source of ['magicbricks', 'housing', '99acres', 'website', 'personal']) {
      const result = await database.query(`INSERT INTO leads (source,name,name_normalized,phone,city,project_name,next_follow_up_at,lead_date)
        VALUES ($1,$2,$2,$3,$4,'Test project',now(),now()) RETURNING id`, [source, source + ' visitor', '98765432' + String(index++).padStart(2, '0'), source + ' city']);
      leadIds[source] = result.rows[0].id;
    }
    const period = '?from=2020-01-01T00:00:00Z&to=2040-01-01T00:00:00Z&dateField=created_at';

    await t.test('portal lists, filters, counts, reminders, KPI and exports are scoped', async () => {
      for (const [username, sources] of Object.entries({ 'magic.calls': ['magicbricks'], 'housing.calls': ['housing', 'website', 'personal'], 'acres.calls': ['99acres'] })) {
        const token = tokens[username];
        const list = await call('/crm/leads', token);
        assert.equal(list.total, sources.length);
        assert.deepEqual(list.leads.map((lead: any) => lead.source).sort(), sources.sort());
        const options = await call('/crm/filters/options', token);
        assert.deepEqual(options.sources.sort(), sources.sort());
        assert(options.cities.every((city: any) => sources.some(source => city.value === source + ' city')));
        const counts = await call('/crm/leads/chip-counts', token);
        assert.equal(counts.needsContact, sources.length);
        const calls = await call('/crm/leads/today-calls', token);
        assert(calls.dueToday.every((lead: any) => sources.includes(lead.source)));
        const kpis = await call('/crm/kpis' + period, token);
        assert.equal(kpis.scorecards.current.totalLeads, sources.length);
        const exportCsv = await call('/crm/leads/export.csv', token);
        for (const source of Object.keys(leadIds)) assert.equal(exportCsv.includes(source + ' visitor'), sources.includes(source));
      }
      assert.equal((await call('/crm/leads?source=housing', tokens['magic.calls'])).total, 0);
      assert.equal((await call('/crm/kpis' + period + '&source=housing', tokens['magic.calls'])).scorecards.current.totalLeads, 0);
      assert.equal((await call('/crm/kpis' + period + '&source=custom', tokens['housing.calls'])).scorecards.current.totalLeads, 2);
      assert.equal((await call('/crm/leads/check-duplicate?phone=9876543201', tokens['magic.calls'])).match, null);
      const concurrent = await Promise.all(Array.from({ length: 12 }, (_, n) => call('/crm/leads', tokens[n % 2 ? 'magic.calls' : 'housing.calls'])));
      concurrent.forEach((result, n) => assert.equal(result.total, n % 2 ? 1 : 3));
    });
    await t.test('admin accounts require valid roles, unique usernames and unique active team links', async () => {
      await call('/team-accounts', adminToken, 'PUT', { username: 'other.admin', name: 'No', role: 'admin', password }, 400);
      await call('/team-accounts', adminToken, 'PUT', { username: 'missing.portal', name: 'No', role: 'telecaller', password }, 400);
      await call('/team-accounts', adminToken, 'PUT', { username: 'magic.calls', name: 'Duplicate', role: 'telecaller', portal: 'housing', password }, 409);
      await call('/team-accounts', adminToken, 'PUT', { username: 'second.link', name: 'Duplicate link', role: 'agent', agentId: team.agent.id, password }, 409);
      const old = (await database.query("INSERT INTO users (email,name,role,password_hash) VALUES ('old@test.invalid','Old shared login','sales',$1) RETURNING *", [hash])).rows[0];
      await call('/auth/login', '', 'POST', { email: old.email, password }, 401);
      const oldToken = signAuthToken({ sub: old.id, email: old.email, role: 'sales', sessionVersion: 0 });
      await call('/crm/leads', oldToken, 'GET', undefined, 401);
    });
    await t.test('direct ids, writes and admin functions cannot bypass roles', async () => {
      const magic = tokens['magic.calls'];
      for (const route of [`/crm/leads/${leadIds.housing}`, `/crm/leads/${leadIds.housing}/interests`]) await call(route, magic, 'GET', undefined, 404);
      await call(`/crm/leads/${leadIds.housing}`, magic, 'PATCH', { notes: 'Not allowed' }, 404);
      await call(`/crm/leads/${leadIds.housing}/activities`, magic, 'POST', { type: 'note', content: 'No' }, 404);
      await call('/crm/leads/bulk', magic, 'POST', { ids: [leadIds.magicbricks, leadIds.housing], action: 'change_status', payload: { status: 'contacted' } }, 404);
      await call('/crm/leads/bulk', magic, 'POST', { ids: [leadIds.magicbricks], action: 'delete' }, 403);
      await call('/team-accounts', magic, 'GET', undefined, 403);
      await call('/team-accounts', magic, 'PUT', { role: 'admin' }, 403);
      await call('/crm/agents', magic, 'POST', { name: 'Unauthorized member' }, 403);
      await call('/crm/agents/stats', magic, 'GET', undefined, 403);
      await call('/crm/imports', magic, 'GET', undefined, 403);
      await call('/crm/import/preview', magic, 'POST', {}, 403);
      await call(`/crm/leads/${leadIds.magicbricks}`, magic, 'DELETE', undefined, 403);
      await call('/crm/leads', magic, 'POST', { name: 'Custom', phone: '9876543299' }, 403);
      assert.equal((await call('/crm/leads', tokens['team.one'])).total, 0);
    });
    await t.test('assignment gives the linked member access; updates are shared with telecaller and admin', async () => {
      await call(`/crm/leads/${leadIds.magicbricks}`, tokens['magic.calls'], 'PATCH', { agentId: team.agent.id });
      assert.equal((await call('/crm/leads', tokens['team.one'])).total, 1);
      await call(`/crm/leads/${leadIds.magicbricks}`, tokens['team.two'], 'GET', undefined, 404);
      await call(`/crm/leads/${leadIds.magicbricks}`, tokens['team.one'], 'PATCH', { agentId: otherTeam.agent.id }, 403);
      await call(`/crm/leads/${leadIds.magicbricks}`, tokens['team.one'], 'PATCH', { status: 'contacted', notes: 'Qualified by member' });
      await call(`/crm/leads/${leadIds.magicbricks}/activities`, tokens['team.one'], 'POST', { type: 'note', content: 'Call complete', nextFollowUpAt: '2030-01-01T04:30:00Z' }, 201);
      for (const token of [adminToken, tokens['magic.calls']]) {
        const detail = await call(`/crm/leads/${leadIds.magicbricks}`, token);
        assert.equal(detail.lead.status, 'contacted');
        assert.equal(detail.lead.notes, 'Qualified by member');
        assert(detail.activities.some((activity: any) => activity.content === 'Call complete'));
      }
      for (const token of [adminToken, tokens['magic.calls'], tokens['team.one']]) {
        const list = await call('/crm/leads', token);
        const row = list.leads.find((lead: any) => lead.id === leadIds.magicbricks);
        assert.equal(row.latest_note, 'Call complete');
        assert(row.latest_note_at);
        assert.equal(new Date(row.next_follow_up_at).toISOString(), '2030-01-01T04:30:00.000Z');
      }
      const longNote = 'Detailed follow-up note '.repeat(40);
      await call(`/crm/leads/${leadIds.magicbricks}/activities`, tokens['team.one'], 'POST', { type: 'note', content: longNote }, 201);
      const preview = (await call('/crm/leads', tokens['team.one'])).leads.find((lead: any) => lead.id === leadIds.magicbricks);
      assert.equal(preview.latest_note, longNote.slice(0, 240));
      const full = await call(`/crm/leads/${leadIds.magicbricks}`, tokens['team.one']);
      assert(full.activities.some((activity: any) => activity.content === longNote));
      const memberKpis = await call('/crm/kpis' + period, tokens['team.one']);
      assert.equal(memberKpis.scorecards.current.totalLeads, 1);
      const leaderboard = await call('/crm/kpis/agents' + period, tokens['team.one']);
      assert(leaderboard.leaderboard.every((row: any) => row.agentId === team.agent.id));
      await call(`/crm/leads/${leadIds.magicbricks}`, tokens['magic.calls'], 'PATCH', { agentId: otherTeam.agent.id });
      assert.equal((await call('/crm/leads', tokens['team.one'])).total, 0);
      assert.equal((await call('/crm/leads', tokens['team.two'])).total, 1);
    });
    await t.test('website and manual inputs are Custom and Housing can assign them', async () => {
      const website = await call('/public/leads', '', 'POST', { name: 'Website contact', phone: '9876543288', project: 'Website project' }, 201);
      const manual = await call('/crm/leads', tokens['housing.calls'], 'POST', { name: 'Manual contact', phone: '9876543287', agentId: team.agent.id }, 201);
      const list = await call('/crm/leads?source=website,personal', tokens['housing.calls']);
      assert(list.leads.some((lead: any) => lead.id === website.id));
      assert(list.leads.some((lead: any) => lead.id === manual.id));
      assert.equal((await call(`/crm/leads/${manual.id}`, tokens['team.one'])).lead.source, 'personal');
      const own = await call('/crm/leads', tokens['team.one'], 'POST', { name: 'Member manual contact', phone: '9876543286', agentId: otherTeam.agent.id }, 201);
      assert.equal((await call(`/crm/leads/${own.id}`, tokens['team.one'])).lead.agent_id, team.agent.id);
      const repeated = await call('/crm/leads', tokens['housing.calls'], 'POST', { name: 'Existing portal contact', phone: '9876543200' }, 201);
      const repeatedDetail = await call(`/crm/leads/${repeated.id}`, tokens['housing.calls']);
      assert.equal(repeatedDetail.lead.source, 'personal');
      assert.equal(repeatedDetail.lead.is_duplicate, true);
    });
    await t.test('admin edits revoke sessions and passwords are never returned', async () => {
      const accounts = (await call('/team-accounts')).accounts;
      assert(accounts.every((account: any) => !('password_hash' in account) && !('password' in account)));
      await call('/team-accounts', adminToken, 'PUT', { id: magicAccount.id, username: 'magic.calls', name: 'Magic calls', role: 'telecaller', portal: 'magicbricks', password: 'Replacement-password-123', isActive: true });
      await call('/crm/leads', tokens['magic.calls'], 'GET', undefined, 401);
      await call('/auth/login', '', 'POST', { email: 'magic.calls', password }, 401);
      const updated = await call('/auth/login', '', 'POST', { email: 'magic.calls', password: 'Replacement-password-123' });
      await call('/team-accounts', adminToken, 'PUT', { id: magicAccount.id, username: 'magic.calls', name: 'Magic calls', role: 'telecaller', portal: 'magicbricks', isActive: false });
      await call('/crm/leads', updated.token, 'GET', undefined, 401);
      await call('/auth/login', '', 'POST', { email: 'magic.calls', password: 'Replacement-password-123' }, 401);
      await call('/auth/sales-account', adminToken, 'PUT', { email: 'old@test.invalid', password }, 410);
    });
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
    await database.end();
    await adminDb.query('DROP SCHEMA ' + schema + ' CASCADE');
    await adminDb.end();
  }
});
