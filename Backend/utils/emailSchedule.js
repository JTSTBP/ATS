const crypto = require('crypto');
const IST_OFFSET = 330 * 60000;
const DAY = 86400000;
const localDayStart = date => Math.floor((date.getTime() + IST_OFFSET) / DAY) * DAY - IST_OFFSET;

// Persist generated dates on the drafts; retries must not generate a new timetable.
const scheduleForStep = (step, startedAt = new Date()) => {
  if (!Number.isInteger(step) || step < 0 || !Number.isFinite(startedAt.getTime())) throw new Error('Invalid email schedule');
  let day = localDayStart(startedAt);
  const minute = (startedAt.getTime() - day) / 60000;
  if (minute > 1215) day += DAY;
  let previousMinute = null;
  let scheduled;
  for (let index = 0; index <= step; index++) {
    let sendMinute = 540 + crypto.createHash('sha256').update(`${startedAt.toISOString()}:${index}`).digest().readUInt32BE(0) % 676;
    if (sendMinute === previousMinute) sendMinute = sendMinute === 1215 ? 540 : sendMinute + 1;
    scheduled = index === 0 && minute >= 540 && minute <= 1215
      ? new Date(startedAt)
      : new Date(day + index * DAY + sendMinute * 60000);
    previousMinute = (scheduled.getTime() - localDayStart(scheduled)) / 60000;
  }
  return scheduled;
};

const sendingDayStart = (now = new Date()) => {
  const day = localDayStart(now);
  const hour = (now.getTime() - day) / 3600000;
  return hour >= 9 && hour < 20.5 ? new Date(day) : null;
};

module.exports = { scheduleForStep, sendingDayStart };
