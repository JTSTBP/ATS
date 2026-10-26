const test = require('node:test');
const assert = require('node:assert/strict');
let docs = [];
let sends = 0;
const model = {
  updateMany: async () => ({}),
  find: () => ({sort: () => ({limit: async () => docs.filter(d=>d.status==='scheduled' && d.scheduledAt <= new Date())})}),
  findOne: async filter => docs.find(d=>d.status==='sent' && d.sentAt >= filter.sentAt.$gte),
  findOneAndUpdate: async filter => { const doc=docs.find(d=>d._id===filter._id && d.status===filter.status); if(doc) doc.status='pending'; return doc; },
  updateOne: async (filter, update) => {const doc=docs.find(d=>d._id===filter._id && d.status===filter.status); if(doc) Object.assign(doc,update.$set);},
};
require.cache[require.resolve('../models/Communication')]={exports:model};
require.cache[require.resolve('../services/emailService')]={exports:{formatEmailErrorResponse:e=>({message:e.message})}};
require.cache[require.resolve('../services/userEmailService')]={exports:{sendUserMail:async()=>{sends++;return {messageId:'test'};}}};
require.cache[require.resolve('../services/whatsappService')]={exports:{sendWhatsAppMessage:async()=>{throw new Error('Unexpected WhatsApp send');}}};
const {runEmailSequenceWorkerOnce}=require('../services/emailSequenceWorker');
test('worker defers night sends and sends only one overdue email per sequence per day', async t => {
  t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-26T15:00:00Z')});
  docs=[0,1].map(step=>({_id:String(step),recruiterId:'recruiter',sequenceId:'sequence',channel:'EMAIL',status:'scheduled',scheduledAt:new Date('2026-10-26T03:30:00Z'),sequenceStep:step,save:async()=>{}}));
  assert.deepEqual(await runEmailSequenceWorkerOnce(),{checked:0,sent:0,failed:0});
  assert.equal(sends,0);
  t.mock.timers.setTime(new Date('2026-10-27T03:30:00Z').getTime());
  await runEmailSequenceWorkerOnce();
  assert.equal(sends,1);
  assert.equal(new Date(docs[1].scheduledAt.getTime()+330*60000).toISOString().slice(0,10),'2026-10-28');
  await runEmailSequenceWorkerOnce();
  assert.equal(sends,1);
  t.mock.timers.setTime(new Date('2026-10-27T08:30:00Z').getTime());
  await runEmailSequenceWorkerOnce();
  assert.equal(sends,1);
  t.mock.timers.setTime(docs[1].scheduledAt.getTime());
  await runEmailSequenceWorkerOnce();
  assert.equal(sends,2);
});

