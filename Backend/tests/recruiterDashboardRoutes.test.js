const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup() {
  const handlers = {}, queries = [];
  const chain = value => ({ select(){return this}, populate(){return this}, sort(){return this}, limit(){return this}, lean: async () => value });
  const router = { use(){}, get(p, h){handlers['GET '+p]=h}, patch(p,h){handlers['PATCH '+p]=h} };
  const Candidate = { find: q => { queries.push(q); return chain([]); }, findOneAndUpdate: async (q, u) => { queries.push({ q, u }); return { _id: 'c' }; } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../routes/RecruiterDashboardroutes'), 'utf8'), { module:{exports:{}}, console, Date, require(name){
    if(name==='express')return { Router:()=>router };
    if(name==='mongoose')return { isValidObjectId: ()=>true };
    if(name.includes('authMiddleware'))return { protect(){} };
    if(name.includes('recruiterTargets'))return require('../services/recruiterTargets');
    if(name.includes('CandidatesByJob'))return Candidate;
    if(name.includes('Users')||name.includes('Jobs'))return { find:()=>({distinct:async()=>['team-id']}) };
    return { find:()=>chain([]) };
  } });
  const res={status(code){this.code=code;return this}, json(body){this.body=body}};
  return {handlers,queries,res};
}
test('dashboard scopes every candidate query to authenticated recruiter',async()=>{
  const s=setup();await s.handlers['GET /']({user:{_id:'recruiter',dateOfJoining:'2026-10-20'}},s.res);
  assert.equal(s.queries[0].createdBy,'recruiter');assert.equal(s.res.body.metrics.closureTarget,7);
});
test('recruiters cannot approve their own daily submissions',async()=>{
  const s=setup();await s.handlers['PATCH /approvals/:id']({user:{designation:'Recruiter'},params:{id:'c'},body:{status:'Approved'}},s.res);
  assert.equal(s.res.code,403);assert.equal(s.queries.length,0);
});
test('mentor review is team-scoped, atomic, and records authenticated reviewer',async()=>{
  const s=setup();await s.handlers['PATCH /approvals/:id']({user:{_id:'mentor',designation:'Mentor'},params:{id:'c'},body:{status:'Approved'}},s.res);
  const {q,u}=s.queries[0];assert.equal(q.createdBy.$ne,'mentor');assert.equal(q.$or[0].createdBy.$in[0],'team-id');assert.ok(q['lineupApproval.status'].$nin.includes('Approved'));assert.equal(u.$set.lineupApproval.reviewedBy,'mentor');assert.equal(s.res.body.success,true);
});

test("approval queue is available only to mentors", async () => {
 for (const designation of ["Recruiter", "Manager", "Admin"]) {
  const s = setup();
  await s.handlers["GET /approvals"]({ user: { designation } }, s.res);
  assert.equal(s.res.code, 403); assert.equal(s.queries.length, 0);
 }
});
