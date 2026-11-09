const test = require('node:test');
const assert = require('node:assert/strict');
const { scopedStaff, workMinutes, activityState, recruiterRow, productiveActions } = require('../services/teamDashboard');
const { reassignMandate } = require('../services/reassignMandate');
const manager = { _id:'manager', designation:'Manager' }, mentor = { _id:'mentor', designation:'Mentor', reporter:'manager' };
const staff = [manager,mentor,{_id:'r1',name:'One',designation:'Recruiter',reporter:'mentor'},{_id:'r2',name:'Two',designation:'Recruiter',secondary_managers:['mentor']},{_id:'other',designation:'Recruiter',reporter:'elsewhere'},{_id:'disabled',designation:'Recruiter',reporter:'mentor',isDisabled:true}];
test('team scope follows primary and secondary reports without leaking other pods',()=>{
 assert.deepEqual(scopedStaff(mentor,staff).map(u=>u._id),['mentor','r1','r2']);
 assert.deepEqual(scopedStaff(manager,staff).map(u=>u._id),['manager','mentor','r1','r2']);
 assert.equal(scopedStaff(manager,[...staff,{_id:'cycle',reporter:'manager',secondary_managers:['cycle']}]).length,5);
});
test('activity excludes lunch, pauses outside shift and distinguishes never started',()=>{
 assert.equal(workMinutes('2026-11-09T07:00Z',new Date('2026-11-09T08:30Z')),30);
 assert.equal(activityState({now:new Date('2026-11-09T07:45Z'),lastWrite:'2026-11-09T04:00Z'}).status,'Break');
 assert.equal(activityState({now:new Date('2026-11-09T03:00Z'),lastWrite:'2026-11-08T04:00Z'}).status,'Off shift');
 assert.equal(activityState({now:new Date('2026-11-08T06:00Z'),lastWrite:'2026-11-08T04:00Z'}).status,'Off shift');
 assert.equal(activityState({now:new Date('2026-11-09T06:00Z')}).status,'Not started');
 assert.ok(!productiveActions.includes('candidate_viewed'));
});
test('idle thresholds use saved activity and acknowledgements expire or reset on a new write',()=>{
 const now=new Date('2026-11-09T06:00Z'),lastWrite='2026-11-09T04:30:00.000Z';
 assert.equal(activityState({now,lastWrite}).status,'Critical');
 assert.equal(activityState({now:new Date('2026-11-09T05:00Z'),lastWrite}).status,'Idle');
 const state={acknowledgements:{mentor:{until:'2026-11-09T06:30Z',activityAt:lastWrite}}};
 assert.equal(activityState({now,lastWrite,state,supervisorId:'mentor'}).alert,false);
 assert.equal(activityState({now,lastWrite,state,supervisorId:'manager'}).alert,true);
 assert.equal(activityState({now:new Date('2026-11-09T06:31Z'),lastWrite,state,supervisorId:'mentor'}).alert,true);
 assert.equal(activityState({now:new Date('2026-11-09T08:00Z'),lastWrite:'2026-11-09T05:00:00.000Z',state,supervisorId:'mentor'}).status,'Break');
});
test('approved breaks mute activity and tracking resumes from the end of the break',()=>{
 const state={breakUntil:'2026-11-09T06:00Z'};
 assert.equal(activityState({now:new Date('2026-11-09T05:45Z'),lastWrite:'2026-11-09T04:00Z',state}).status,'Break');
 assert.equal(activityState({now:new Date('2026-11-09T06:10Z'),lastWrite:'2026-11-09T04:00Z',state}).idleMinutes,10);
});
test('team rows reuse DOJ target cycles, durable sourcing credit and explicit line-up approvals',()=>{
 const row=recruiterRow({user:{_id:'r1',name:'One',dateOfJoining:'2026-10-20'},now:new Date('2026-11-09T06:00Z'),candidates:[{_id:'c',createdAt:'2026-11-09T04:30Z',status:'Joined',joiningDate:'2026-11-02',lineupApproval:{status:'Approved'}}],sources:[],sourceLogs:[{targetId:'s',createdAt:'2026-11-09T04:30Z'},{targetId:'s',createdAt:'2026-11-09T04:30Z'}],activity:[{_id:'a',actionType:'candidate_created',createdAt:'2026-11-09T04:30Z'}],lastWrite:'2026-11-09T04:30Z',state:{}});
 assert.equal(row.metrics.sourced,1);assert.equal(row.metrics.approved,1);assert.equal(row.metrics.closures,1);assert.equal(row.metrics.window.start,'2026-10-20');assert.equal(row.hourly.reduce((n,b)=>n+b.additions,0),1);
});
test('mentor reassignment preserves other mentor allocations and lead metadata',()=>{
 const job={status:'Open',assignedRecruiters:['r1','outside'],assignedMentors:['mentor','elsewhere'],leadRecruiter:'outside',mentorAssignments:{mentor:{mentorId:'mentor',assignedRecruiters:['r1'],leadRecruiter:'r1'},elsewhere:{mentorId:'elsewhere',assignedRecruiters:['outside'],leadRecruiter:'outside'}}};
 const result=reassignMandate(job,'r1','r2',mentor,staff);
 assert.deepEqual(result.assignedRecruiters,['outside','r2']);assert.equal(result.leadRecruiter,'outside');assert.equal(result.mentorAssignments.elsewhere.leadRecruiter,'outside');assert.equal(result.mentorAssignments.mentor.leadRecruiter,'r2');
 assert.deepEqual(job.assignedRecruiters,['r1','outside']);
 assert.throws(()=>reassignMandate(job,'r1','other',mentor,scopedStaff(mentor,staff)),/team/);
 assert.throws(()=>reassignMandate({...job,assignedMentors:[]},'r1','r2',mentor,staff),/not assigned/);
});
test('manager cross-mentor reassignment moves the allocation and preserves external pods',()=>{
 const team=[...staff,{_id:'mentor2',designation:'Mentor',reporter:'manager'},{_id:'r3',designation:'Recruiter',reporter:'mentor2'}];
 const job={status:'Open',assignedRecruiters:['r1','outside'],assignedMentors:['mentor','external'],leadRecruiter:'r1',mentorAssignments:{mentor:{mentorId:'mentor',assignedRecruiters:['r1'],leadRecruiter:'r1'},external:{mentorId:'external',assignedRecruiters:['outside'],leadRecruiter:'outside'}}};
 const result=reassignMandate(job,'r1','r3',manager,scopedStaff(manager,team));
 assert.deepEqual(result.assignedRecruiters,['outside','r3']);assert.equal(result.mentorAssignments.mentor2.leadRecruiter,'r3');assert.equal(result.mentorAssignments.external.leadRecruiter,'outside');assert.equal(result.leadRecruiter,'r3');
});
test('sourcing and pending-review warnings are independent of recent profile editing',()=>{
 const now=new Date('2026-11-09T06:00Z');
 const options={user:{_id:'r1',name:'One'},now,candidates:[{createdAt:'2026-11-09T04:30Z',status:'New'}],sources:[],sourceLogs:[{targetId:'s',createdAt:'2026-11-09T04:30Z'}],activity:[{createdAt:'2026-11-09T05:59Z',actionType:'candidate_updated'}],lastWrite:'2026-11-09T05:59Z',state:{}};
 const row=recruiterRow(options);assert.equal(row.status,'Active');assert.equal(row.sourcingWarning,true);assert.equal(row.pendingWarning,true);
 const onBreak=recruiterRow({...options,state:{breakUntil:'2026-11-09T06:10Z'}});assert.equal(onBreak.sourcingWarning,false);assert.equal(onBreak.pendingWarning,false);
});
test('staff without attendance or work are not marked on lunch break or counted present',()=>{
 const now=new Date('2026-11-09T07:45Z');
 assert.equal(activityState({now}).status,'Not started');
 assert.equal(activityState({now,attendance:{status:'Leave',createdAt:'2026-11-09T04:00Z'}}).present,false);
});
test('missed daily quotas remain behind pace after shift while inactivity alerts stay muted',()=>{
 const row=recruiterRow({user:{_id:'r',name:'Recruiter'},now:new Date('2026-11-09T14:00Z'),candidates:[],sources:[],sourceLogs:[],activity:[],lastWrite:'2026-11-09T04:30Z',state:{}});
 assert.equal(row.status,'Off shift');assert.equal(row.alert,false);assert.equal(row.behind,true);
});
