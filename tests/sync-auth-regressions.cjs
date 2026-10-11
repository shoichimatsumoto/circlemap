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

  const authEnv = {};
  const auth = load('src/lib/sync-auth.ts', {}, { process: { env: authEnv } });
  assert.equal(auth.checkSyncAuthValue('test-sync').ok, false);
  authEnv.SYNC_SECRET = 'test-sync';
  authEnv.CRON_SECRET = 'test-cron';
  assert.equal(auth.checkSyncAuthValue('test-sync').ok, true);
  assert.equal(auth.checkSyncAuthValue('test-cron').ok, true);
  assert.equal(auth.checkSyncAuthValue('wrong').ok, false);
  assert.equal(auth.checkSyncAuth(new Request('https://example.test/', { headers: { authorization: 'Bearer test-cron' } })).ok, true);
  assert.equal(auth.checkSyncAuth(new Request('https://example.test/?secret=wrong')).ok, false);
  console.log('PASS: sync authentication requires configured secrets');

assert(!readFileSync(path.join(__dirname, '../src/lib/sync-auth.ts'), 'utf8').includes('DOCUMENTED_SYNC_SECRET'));
