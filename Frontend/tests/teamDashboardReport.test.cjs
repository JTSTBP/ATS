const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const result={exports:{}},downloads=[];let report;
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'../src/components/Common/teamDashboardTypes.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:result.exports,module:result,Blob,Date,URL:{createObjectURL(blob){report=blob;return'blob:test'},revokeObjectURL(){}},document:{createElement(){return{click(){downloads.push(this.download)}}}}});
test('team CSV escapes formulas and quotes while preserving the 50/5/7 target contract',async()=>{
 const row={name:'  =HYPERLINK("bad")',status:'Active',metrics:{sourced:34,approved:4,pending:2,closures:5,window:{start:'2026-10-20',end:'2026-11-18'}},lastWrite:'2026-11-09T06:00:00Z',idleMinutes:6};
 result.exports.exportTeamReport({date:'2026-11-09'},[row]);const csv=await report.text();
 assert.ok(csv.includes('"\'  =HYPERLINK(""bad"")"'));
 assert.ok(csv.includes('"34","50","4","5","2","5","7"'));
 assert.deepEqual(downloads,['team-shift-report-2026-11-09.csv']);
});
