const test = require('node:test');
const assert = require('node:assert/strict');
const { scheduleForStep, sendingDayStart } = require('../utils/emailSchedule');
const ist = date => new Date(date.getTime()+330*60000);
test('one email each calendar day, varying times within the daytime window', () => {
  const start=new Date('2026-10-26T13:00:00Z');
  const dates=Array.from({length:5},(_,i)=>scheduleForStep(i,start));
  assert.equal(dates[0].getTime(),start.getTime());
  dates.forEach((date,i)=>{
    const local=ist(date); const minutes=local.getUTCHours()*60+local.getUTCMinutes();
    assert.equal(local.getUTCDate(),26+i);
    assert.ok(minutes>=540 && minutes<=1215);
    if(i) assert.notEqual(minutes,ist(dates[i-1]).getUTCHours()*60+ist(dates[i-1]).getUTCMinutes());
    assert.equal(scheduleForStep(i,start).getTime(),date.getTime());
  });
});
test('late-night starts and month/year rollover move to the next day', () => {
  const next=ist(scheduleForStep(0,new Date('2026-12-31T15:01:00Z')));
  assert.equal(next.toISOString().slice(0,10),'2027-01-01');
  assert.ok(next.getUTCHours()>=9 && next.getUTCHours()<=20);
});
test('sending window excludes night and the 8:30 PM cutoff', () => {
  assert.equal(sendingDayStart(new Date('2026-10-26T03:29:59Z')),null);
  assert.equal(sendingDayStart(new Date('2026-10-26T15:00:00Z')),null);
  assert.equal(sendingDayStart(new Date('2026-10-26T15:01:00Z')),null);
  assert.equal(sendingDayStart(new Date('2026-10-26T14:59:59Z')).toISOString(),'2026-10-25T18:30:00.000Z');
});
