// Offline regression checks: no production credentials or network calls.
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : {},
    console: { log() {}, error() {} }, URL, Request, ...globals,
  }, { filename: file });
  return module.exports;
}

async function main() {
  const types = load('src/lib/types.ts');
  const seo = load('src/lib/seo.ts', { '@/lib/types': types });
  const work = { title: '作品', circleName: 'サークル', mediaType: 'manga', price: 880,
    date: '2026/01/01', tags: [], description: '公式コメント'.repeat(20) };
  const description = seo.buildWorkSeoDescription(work);
  assert(!description.includes('公式コメント'));
  assert(description.includes('サークル') && description.includes('880'));
  console.log('PASS: SEO excludes official comments and retains circle/price');

  const comments = load('src/lib/fanza-comment.ts', {
    '@/lib/dmm-transform': { isUsefulWorkDescription: text => !!text && text.length >= 40 },
  }, { fetch() { throw new Error('Unexpected network request'); } });
  assert.equal(await comments.resolveWorkDescription({ workId: 'missing' }), undefined);
  assert.equal(await comments.resolveWorkDescription({ workId: 'known', dbDescription: work.description }), work.description);
  console.log('PASS: page comment resolution does not fetch or write');

  const api = load('src/app/api/tools/backfill-comment/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
  }, { process: { env: { SYNC_SECRET: 'test-only' } } });
  assert.equal((await api.GET(new Request('https://example.test/?secret=test-only'))).status, 401);
  assert.equal((await api.GET(new Request('https://example.test/', { headers: { authorization: 'Bearer wrong' } }))).status, 401);
  assert.equal((await api.GET(new Request('https://example.test/', { headers: { authorization: 'Bearer test-only' } }))).status, 400);
  console.log('PASS: diagnostic API rejects URL secrets and requires Bearer auth');

  function circleData(db, dmm = {}) {
    return load('src/lib/data.ts', {
      react: { cache: fn => fn },
      '@/lib/mock-data': { DEMO_CIRCLE: { id: 'demo' } },
      '@/lib/supabase-db': db,
      '@/lib/dmm': { hasDmmCredentials: () => false, ...dmm },
      '@/lib/dmm-transform': { dedupeWorks: xs => xs },
    });
  }
  const emptyDb = { dbGetCircle: async () => null, dbGetCircleWorks: async () => [] };
  assert.equal(await circleData(emptyDb).getCirclePage('123'), null);
  await assert.rejects(circleData({ ...emptyDb, dbGetCircle: async () => { throw Error('offline'); } }).getCirclePage('123'), /temporarily unavailable/);
  const emptyResponse = { result: { status: 200, items: [] } };
  await assert.rejects(circleData(emptyDb, {
    hasDmmCredentials: () => true,
    fetchItemsByMaker: async () => { throw Error('offline'); },
    fetchDoujinGameItems: async () => emptyResponse,
  }).getCirclePage('123'), /temporarily unavailable/);
  const found = { id: '123' };
  assert.equal((await circleData({ dbGetCircle: async () => found, dbGetCircleWorks: async () => [work] }).getCirclePage('123')).circle, found);
  console.log('PASS: missing circle returns null; DB/DMM failures throw; existing circle loads');

  const db = load('src/lib/supabase-db.ts', {
    '@/lib/supabase': { createSupabaseAnonClient: () => ({ from: () => ({
      select: () => ({ eq: () => ({
        maybeSingle: async () => ({ error: { message: 'offline' }, data: null }),
        order: async () => ({ error: { message: 'offline' }, data: null }),
      }) }),
    }) }), hasSupabasePublicConfig: () => true },
  });
  await assert.rejects(db.dbGetCircle('123'), /lookup failed/);
  await assert.rejects(db.dbGetCircleWorks('123'), /lookup failed/);
  console.log('PASS: database errors are not converted to missing records');

  async function runBackfill(ok) {
    const processMock = { argv: ['node', 'script', '123'], cwd: () => '.', exitCode: 0 };
    load('scripts/backfill-comments.ts', {
      dotenv: { config() {} }, path,
      '../src/lib/fanza-comment': { fetchFanzaWorkComment: async () => work.description, dbSaveWorkDescription: async () => ({ ok }) },
    }, { process: processMock, setTimeout: fn => { fn(); } });
    await new Promise(resolve => setImmediate(resolve));
    return processMock.exitCode;
  }
  assert.equal(await runBackfill(false), 1);
  assert.equal(await runBackfill(true), 0);
  console.log('PASS: failed saves exit nonzero; successful saves exit zero');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
