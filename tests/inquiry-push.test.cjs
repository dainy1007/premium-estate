const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const publicKey = 'BPP-b6IjZYkLoYQZ-gTMz1MhQqTy6IDVPhTq5O83N82BdU8u9JhE0djEh-vO5dq0Z5wVzCQ3gconX1SClvxtG44';
const clone = value => JSON.parse(JSON.stringify(value));
const quietConsole = { log() {}, error() {}, warn() {} };
function load(file, mocks = {}, globals = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
    console: quietConsole, Request, Response, atob, Uint8Array, ...globals,
  }, { filename: file });
  return module.exports;
}
function hooks(initial = []) {
  const values = [...initial];
  const effects = [];
  let cursor = 0;
  return {
    values, effects, reset() { cursor = 0; },
    react: {
      useState(value) {
        const index = cursor++;
        if (!(index in values)) values[index] = value;
        return [values[index], next => { values[index] = typeof next === 'function' ? next(values[index]) : next; }];
      },
      useEffect(effect) { effects.push(effect); },
    },
  };
}
function findNode(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) { const found = findNode(child, predicate); if (found) return found; }
    return null;
  }
  if (predicate(node)) return node;
  return findNode(node.props?.children, predicate);
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const post = (url, body) => new Request('https://example.com' + url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
function inquiryRoute({ failInsert = false, failPush = false } = {}) {
  const inserts = [], pushes = [];
  const route = load('app/api/inquiries/route.ts', {
    '@supabase/supabase-js': { createClient: () => ({ from: () => ({ insert: async row => {
      inserts.push(clone(row)); return { error: failInsert ? { message: 'test failure' } : null };
    } }) }) },
    '@/lib/push-server': { sendInquiryPush: async (name, message) => {
      pushes.push({ name, message });
      if (failPush) throw new Error('test push failure');
      return { sent: 1, failed: 0, expired: 0, subscribers: 1, configured: true };
    } },
  }, { process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test' } } });
  return { route, inserts, pushes };
}

test('property contact submits through the API and preserves email and property title while sending push', async () => {
  const fixture = inquiryRoute();
  const state = hooks(['테스트 고객', '010-0000-0000', 'test@example.com', '매물 상담 요청']);
  const calls = [];
  const Contact = load('components/Contact.tsx', { react: state.react }, {
    fetch: async (url, options) => { calls.push(url); return fixture.route.POST(post(url, JSON.parse(options.body))); },
  }).default;
  const form = findNode(Contact({ propertyTitle: '문의 대상 매물', propertyId: '12' }), node => node.type === 'form');
  await form.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(calls, ['/api/inquiries']);
  assert.equal(fixture.inserts[0].property_title, '문의 대상 매물');
  assert.equal(fixture.inserts[0].email, 'test@example.com');
  assert.equal(fixture.pushes.length, 1);
  assert.match(state.values[5], /정상적으로 접수/);
  assert.equal(state.values[4], false);
});

test('failed storage never sends a push, while failed push still retains the inquiry', async () => {
  const payload = { name: '테스트', phone: '010-0000-0000', message: '상담' };
  const failedStorage = inquiryRoute({ failInsert: true });
  assert.equal((await failedStorage.route.POST(post('/api/inquiries', payload))).status, 500);
  assert.equal(failedStorage.pushes.length, 0);
  const failedPush = inquiryRoute({ failPush: true });
  const response = await failedPush.route.POST(post('/api/inquiries', payload));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(failedPush.inserts.length, 1);
});

test('malformed inquiries are rejected before database or push calls', async () => {
  const fixture = inquiryRoute();
  assert.equal((await fixture.route.POST(post('/api/inquiries', { name: '테스트' }))).status, 400);
  assert.equal((await fixture.route.POST(new Request('https://example.com/api/inquiries', { method: 'POST', body: '{' }))).status, 400);
  assert.equal(fixture.inserts.length, 0);
});

function pushServer() {
  const rows = [
    { endpoint: 'https://push.example/valid', p256dh: 'key', auth: 'auth' },
    { endpoint: 'https://push.example/expired', p256dh: 'key', auth: 'auth' },
    { endpoint: 'https://push.example/failure', p256dh: 'key', auth: 'auth' },
  ];
  const sent = [], removed = [], saved = [];
  const db = { from: () => ({
    upsert: async row => { saved.push(clone(row)); return { error: null }; },
    delete: () => ({ eq: async (_, endpoint) => { removed.push(endpoint); return { error: null }; } }),
    select: () => {
      let endpoint;
      return {
        eq(_, value) { endpoint = value; return this; },
        then(resolve, reject) { return Promise.resolve({ data: endpoint ? rows.filter(row => row.endpoint === endpoint) : rows, error: null }).then(resolve, reject); },
      };
    },
  }) };
  const env = { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test', VAPID_PRIVATE_KEY: 'test-private' };
  const server = load('lib/push-server.ts', {
    '@supabase/supabase-js': { createClient: () => db },
    'web-push': { setVapidDetails() {}, sendNotification: async (subscription, payload, options) => {
      sent.push({ endpoint: subscription.endpoint, payload: JSON.parse(payload), options: clone(options) });
      if (subscription.endpoint.endsWith('/expired')) throw { statusCode: 410 };
      if (subscription.endpoint.endsWith('/failure')) throw { statusCode: 503 };
    } },
  }, { process: { env } });
  return { server, env, sent, removed, saved };
}

test('push sends to registered browsers, removes expired registrations and counts delivery failures', async () => {
  const fixture = pushServer();
  assert.deepEqual(clone(await fixture.server.sendInquiryPush('고객', '상담 요청')), {
    sent: 1, failed: 1, expired: 1, subscribers: 3, configured: true,
  });
  assert.deepEqual(fixture.removed, ['https://push.example/expired']);
  assert.equal(fixture.sent[0].options.urgency, 'high');
  assert.match(fixture.sent[0].payload.body, /고객님/);
  await fixture.server.savePushSubscription({ endpoint: 'https://push.example/valid', p256dh: 'key', auth: 'auth' });
  assert.match(fixture.saved[0].updated_at, /^\d{4}-/);
});

test('test push reaches only the selected saved registration and unknown endpoints are never contacted', async () => {
  const fixture = pushServer();
  assert.equal((await fixture.server.sendTestPush('https://push.example/valid')).sent, 1);
  assert.equal(fixture.sent.length, 1);
  assert.equal(fixture.sent[0].payload.title, '백조현대부동산 알림 테스트');
  assert.equal((await fixture.server.sendTestPush('https://unknown.example')).subscribers, 0);
  assert.equal(fixture.sent.length, 1);
});

test('admin push registration requires authentication and configured server, then replaces old registration', async () => {
  let authenticated = false, configured = true;
  const saved = [], removed = [];
  const route = load('app/api/admin/push/route.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'test' }) }) },
    '@/lib/admin-session': { ADMIN_COOKIE_NAME: 'admin', isValidAdminSession: async () => authenticated },
    '@/lib/push-server': {
      isPushConfigured: () => configured, VAPID_PUBLIC_KEY: publicKey,
      savePushSubscription: async row => saved.push(clone(row)), removePushSubscription: async endpoint => removed.push(endpoint),
    },
  });
  const body = { endpoint: 'https://push.example/new', keys: { p256dh: 'key', auth: 'auth' }, previousEndpoint: 'https://push.example/old' };
  assert.equal((await route.POST(post('/api/admin/push', body))).status, 401);
  authenticated = true; configured = false;
  assert.equal((await route.POST(post('/api/admin/push', body))).status, 503);
  assert.equal(saved.length, 0);
  configured = true;
  assert.equal((await route.POST(post('/api/admin/push', body))).status, 200);
  assert.equal(saved.length, 1);
  assert.deepEqual(removed, ['https://push.example/old']);
});

function browserFixture({ saveFails = false, testExpires = false } = {}) {
  const state = hooks(), calls = [];
  let subscribed = true, unsubscribed = 0, subscribedAgain = 0;
  const subscription = { endpoint: 'https://push.example/old', toJSON: () => ({ endpoint: 'https://push.example/old', keys: { p256dh: 'key', auth: 'auth' } }), unsubscribe: async () => { subscribed = false; unsubscribed++; return true; } };
  const replacement = { ...subscription, endpoint: 'https://push.example/new', toJSON: () => ({ endpoint: 'https://push.example/new', keys: { p256dh: 'key', auth: 'auth' } }) };
  const registration = { pushManager: { getSubscription: async () => subscribed ? subscription : null, subscribe: async () => { subscribedAgain++; return replacement; } } };
  const notification = { permission: 'granted', requestPermission: async () => 'granted' };
  const component = load('components/AdminPushButton.tsx', {
    react: state.react, 'next/navigation': { usePathname: () => '/admin/inquiries' },
  }, {
    window: { PushManager: {}, Notification: notification }, Notification: notification,
    navigator: { serviceWorker: { register: async () => registration, ready: Promise.resolve(registration) } },
    fetch: async (url, options) => {
      calls.push({ url, body: options?.body ? JSON.parse(options.body) : null });
      if (url.endsWith('/test')) return Response.json(testExpires ? { error: '연결 만료' } : { ok: true }, { status: testExpires ? 410 : 200 });
      if (options?.method === 'POST') return Response.json(saveFails ? { error: '등록 실패' } : { ok: true }, { status: saveFails ? 500 : 200 });
      return Response.json({ configured: true, publicKey });
    },
  }).default;
  const render = () => { state.reset(); return component(); };
  return { state, calls, render, get unsubscribed() { return unsubscribed; }, get subscribedAgain() { return subscribedAgain; } };
}

test('existing browser registrations are synced before showing connected, and failed sync never shows connected', async () => {
  for (const saveFails of [false, true]) {
    const fixture = browserFixture({ saveFails });
    fixture.render(); fixture.state.effects[0](); await flush();
    assert.equal(fixture.calls.filter(call => call.body?.endpoint).length, 1);
    assert.equal(fixture.state.values[0], saveFails ? 'error' : 'enabled');
  }
});

test('expired test registration prompts a new subscription rather than saving the expired endpoint again', async () => {
  const fixture = browserFixture({ testExpires: true });
  fixture.render(); fixture.state.effects[0](); await flush();
  const testButton = findNode(fixture.render(), node => node.type === 'button' && node.props.children === '알림 테스트');
  testButton.props.onClick(); await flush();
  assert.equal(fixture.state.values[0], 'error');
  const reconnectButton = findNode(fixture.render(), node => node.type === 'button');
  reconnectButton.props.onClick(); await flush(); await flush();
  assert.equal(fixture.unsubscribed, 1, JSON.stringify({states:fixture.state.values,calls:fixture.calls}));
  assert.equal(fixture.subscribedAgain, 1);
  assert.equal(fixture.calls.at(-1).body.endpoint, 'https://push.example/new');
  assert.equal(fixture.calls.at(-1).body.previousEndpoint, 'https://push.example/old');
});
