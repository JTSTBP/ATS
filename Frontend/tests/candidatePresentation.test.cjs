const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const moduleResult = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/candidatePresentation.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: moduleResult.exports, module: moduleResult });
const { candidatePresentation } = moduleResult.exports;
test('candidate cards map dynamic field spellings without losing zero values', () => {
 const result = candidatePresentation({ dynamicFields: { CandidateName: 'Bittu Gupta', 'Current Location': 'Mumbai', current_ctc: 9, 'Expected CTC': '12 LPA', 'Notice Period': '30 Days', Experience: 0, Email: 'bittu@example.com' } });
 assert.equal(result.name, 'Bittu Gupta'); assert.equal(result.initials, 'BG'); assert.equal(result.location, 'Mumbai');
 assert.equal(result.ctc, '₹9 – ₹12 LPA'); assert.equal(result.experience, '0 Yrs'); assert.equal(result.notice, '30 Days');
});
test('unavailable scores are not invented and last action uses latest history', () => {
 const result = candidatePresentation({ updatedAt: '2026-11-02T00:00:00Z', statusHistory: [{ timestamp: '2026-11-06T00:00:00Z' }] }, Date.parse('2026-11-07T00:00:00Z'));
 assert.equal(result.aiMatch, null); assert.equal(result.lastAction, '1d ago'); assert.equal(result.ctc, '—');
 assert.equal(candidatePresentation({ aiMatchScore: 91 }).aiMatch, 91);
 assert.equal(candidatePresentation({ aiMatchScore: 190 }).aiMatch, null);
});
