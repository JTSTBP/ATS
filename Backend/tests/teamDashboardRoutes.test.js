const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const handlers={},middleware=[],queries=[];const router={use(...args){middleware.push(args)},get(path,handler){handlers['GET '+path]=handler},post(path,handler){handlers['POST '+path]=handler}};
 const state={findOne(q){queries.push(q);return{populate(){return this},lean:async()=>({pings:[]})}},async findOneAndUpdate(q,u,options){queries.push({q,u,options});if(state.duplicate)throw Object.assign(new Error('duplicate'),{code:11000});return{}}};
 const users={find(){return{select(){return this},lean:async()=>[]}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../routes/TeamDashboardroutes'),'utf8'),{module:{exports:{}},console,Date,Set,require(name){if(name==='express')return{Router:()=>router};if(name==='mongoose')return{isValidObjectId:value=>/^[a-f0-9]{24}$/.test(value)};if(name.includes('authMiddleware'))return{protect(){}};if(name.includes('teamDashboard'))return require('../services/teamDashboard');if(name.includes('recruiterTargets'))return require('../services/recruiterTargets');if(name.includes('reassignMandate'))return require('../services/reassignMandate');if(name.endsWith('/activitylog'))return{findOne(q){queries.push({activity:q});return{sort(){return this},select(){return this},lean:async()=>({createdAt:'2026-11-09T04:30:00.000Z'})}}};if(name.endsWith('/Users'))return users;if(name.endsWith('/SupervisorState'))return state;return{};}});
 return{handlers,middleware,queries,state,res:{status(code){this.code=code;return this},json(body){this.body=body}}};
}
test('supervisor middleware rejects recruiters and disabled users before reading team data',async()=>{
 const s=setup();await s.middleware[1][0]({user:{_id:'r',designation:'Recruiter'}},s.res,()=>assert.fail('recruiter reached supervisor handler'));assert.equal(s.res.code,403);
 const t=setup();t.middleware[0][1]({user:{isDisabled:true}},t.res,()=>assert.fail('disabled user accepted'));assert.equal(t.res.code,401);
});
test('inbox reads and acknowledgements always use the authenticated recipient',async()=>{
 const s=setup();await s.handlers['GET /inbox']({user:{_id:'own'},query:{recruiterId:'someone-else'}},s.res);assert.equal(s.queries[0].recruiterId,'own');
 await s.handlers['POST /inbox/:id/read']({user:{_id:'own'},params:{id:'a'.repeat(24)}},s.res);assert.equal(s.queries[1].q.recruiterId,'own');
});
test('supervisor actions cannot target someone outside the resolved team',async()=>{
 const s=setup();await s.handlers['POST /:recruiterId/actions']({teamRecruiters:[],params:{recruiterId:'outside'},body:{kind:'nudge'}},s.res);assert.equal(s.res.code,403);assert.equal(s.queries.length,0);
});
test('nudge cooldown is an atomic unique-recipient write with a bounded inbox',async()=>{
 const s=setup(),req={user:{_id:'mentor'},teamRecruiters:[{_id:'r1'}],params:{recruiterId:'r1'},body:{kind:'nudge',message:'Please review your targets'}};
 await s.handlers['POST /:recruiterId/actions'](req,s.res);const saved=s.queries[0];assert.equal(saved.q.recruiterId,'r1');assert.ok(saved.q.$or);assert.equal(saved.u.$push.pings.$slice,-20);assert.equal(saved.u.$push.pings.$each[0].from,'mentor');assert.equal(s.res.body.success,true);
 s.state.duplicate=true;await s.handlers['POST /:recruiterId/actions'](req,s.res);assert.equal(s.res.code,429);
});
test('only approved break durations can be saved',async()=>{
 const s=setup();await s.handlers['POST /:recruiterId/actions']({teamRecruiters:[{_id:'r1'}],params:{recruiterId:'r1'},body:{kind:'break',minutes:999}},s.res);assert.equal(s.res.code,400);assert.equal(s.queries.length,0);
});
test('historical supervisor action dates are rejected before any write',async()=>{
 const s=setup();await s.handlers['POST /:recruiterId/actions']({teamRecruiters:[{_id:'r1'}],params:{recruiterId:'r1'},body:{kind:'nudge',message:'Hello',date:'2000-01-01'}},s.res);assert.equal(s.res.code,400);assert.equal(s.queries.length,0);
});

test('critical alert acknowledgements bind to the authenticated supervisor and last recorded write',async()=>{
 const s=setup();await s.handlers['POST /:recruiterId/actions']({user:{_id:'mentor'},teamRecruiters:[{_id:'r1'}],params:{recruiterId:'r1'},body:{kind:'acknowledge',supervisorId:'someone-else'}},s.res);
 assert.equal(s.queries[0].activity.userId,'r1');assert.ok(s.queries[0].activity.createdAt.$lte);
 const ack=s.queries[1].u.$set['acknowledgements.mentor'];assert.equal(ack.activityAt,'2026-11-09T04:30:00.000Z');assert.ok(ack.until);assert.equal(s.res.body.success,true);
});
