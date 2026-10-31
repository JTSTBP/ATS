const Communication = require("../models/Communication");
const EmailEnrollment = require('../models/EmailEnrollment');
const { formatEmailErrorResponse } = require("./emailService");

const { sendUserMail } = require("./userEmailService");
const { sendWhatsAppMessage } = require("./whatsappService");
const { assertNotSuppressed } = require('./emailSuppression');
const { checkSequenceReplies, pollSequenceReplies } = require('./emailReplyDetection');

const { scheduleForStep, sendingDayStart } = require("../utils/emailSchedule");

const renderHtml = (body) => String(body || "").replace(/\n/g, "<br/>");

const sendCommunication = async (communication) => {
  const result = communication.channel === "WHATSAPP" ? await sendWhatsAppMessage({ to: communication.recipient, body: communication.body }) : await sendUserMail(communication.recruiterId, {
    to: communication.recipient,
    subject: communication.subject,
    html: renderHtml(communication.body),
    text: communication.body,
    followUpSequenceId: communication.detectReplies ? communication.sequenceId : undefined,
  });
  communication.status = "sent";
  communication.providerMessageId = result.messageId || result.traceId;
  communication.sentAt = new Date();
  communication.errorMessage = undefined;
  await communication.save();
  return communication;
};

const runEmailSequenceWorkerOnce = async () => {
  const now = new Date();
  if (!sendingDayStart(now)) return { checked: 0, sent: 0, failed: 0 };
  await Communication.updateMany({ channel: "WHATSAPP", sequenceId: { $type: "string" }, status: { $in: ["generated", "reviewed", "scheduled", "failed"] } }, { $set: { status: "stopped", stoppedAt: now, stopReason: "whatsapp_direct_messages_only" } });
  const due = await Communication.find({
    channel: "EMAIL",
    sequenceId: { $type: "string" },
    status: "scheduled",
    scheduledAt: { $lte: now },
  }).sort({ scheduledAt: 1, sequenceStep: 1 }).limit(Number(process.env.EMAIL_SEQUENCE_WORKER_BATCH || 10));

  let sent = 0;
  let failed = 0;
  for (const item of due) {
    const dayStart = sendingDayStart(new Date());
    if (!dayStart) break;
    if (item.detectReplies && await Communication.exists({ sequenceId: item.sequenceId, sequenceStep: { $lt: item.sequenceStep }, status: { $in: ['generated', 'reviewed', 'scheduled', 'pending', 'failed', 'stopped'] } })) continue;
    const sentToday = await Communication.findOne({ sequenceId: item.sequenceId, recruiterId: item.recruiterId, channel: "EMAIL", status: "sent", sentAt: { $gte: dayStart } });
    if (sentToday) {
      await Communication.updateOne({ _id: item._id, status: "scheduled" }, { $set: { scheduledAt: scheduleForStep(Math.max(1, item.sequenceStep - (sentToday.sequenceStep || 0)), sentToday.sentAt) } });
      continue;
    }
    const claimed = await Communication.findOneAndUpdate(
      { _id: item._id, status: "scheduled" },
      { $set: { status: "pending", claimedAt: new Date() } },
      { new: true }
    );
    if (!claimed) continue;
    try {
      await assertNotSuppressed(claimed.recipient);
      if (claimed.detectReplies && !(await checkSequenceReplies(claimed))) continue;
      // Recheck after mailbox requests so a stop clicked during the check is respected.
      if (claimed.detectReplies && !(await Communication.exists({ _id: claimed._id, status: 'pending' }))) continue;
      await sendCommunication(claimed);
      sent += 1;
    } catch (error) {
      if (claimed.detectReplies && ['REPLY_CORRELATION_PENDING', 'MICROSOFT_READ_FAILED', 'MICROSOFT_READ_CONSENT_REQUIRED', 'MICROSOFT_RECONNECT_REQUIRED'].includes(error.code)) {
        await Communication.updateOne({ _id: claimed._id, status: 'pending' }, { $set: { status: 'scheduled', scheduledAt: new Date(Date.now() + 5 * 60000), replyCheckError: error.message } });
        continue;
      }
      if (error.code === 'EMAIL_SUPPRESSED') {
        await Communication.updateMany({ sequenceId: claimed.sequenceId, status: { $in: ['pending', 'scheduled', 'generated', 'reviewed', 'failed'] } }, { $set: { status: 'stopped', stoppedAt: new Date(), stopReason: 'suppressed' } });
        continue;
      }
      claimed.status = "failed";
      claimed.errorMessage = JSON.stringify(formatEmailErrorResponse(error));
      await claimed.save();
      if (claimed.detectReplies) await Communication.updateMany({ sequenceId: claimed.sequenceId, status: 'scheduled' }, { $set: { status: 'stopped', stoppedAt: new Date(), stopReason: 'send_failed', errorMessage: claimed.errorMessage } });
      if (["USER_APP_PASSWORD_MISSING", "USER_APP_PASSWORD_REJECTED", "MICROSOFT_RECONNECT_REQUIRED", "SENDER_UNAVAILABLE"].includes(error.code)) {
        await Communication.updateMany({ sequenceId: claimed.sequenceId, recruiterId: claimed.recruiterId, status: "scheduled" }, { $set: { status: "stopped", stoppedAt: new Date(), stopReason: error.code, errorMessage: claimed.errorMessage } });
      }
      failed += 1;
    }
  }
  for (const sequenceId of new Set(due.filter(item => item.detectReplies).map(item => item.sequenceId))) {
    if (!(await Communication.exists({ sequenceId, status: { $in: ['scheduled', 'pending'] } }))) await EmailEnrollment.deleteOne({ sequenceId });
  }
  return { checked: due.length, sent, failed };
};

const startEmailSequenceWorker = () => {
  if (process.env.EMAIL_SEQUENCE_WORKER_ENABLED === "false") {
    console.log("Email sequence worker disabled");
    return null;
  }
  const intervalMs = Number(process.env.EMAIL_SEQUENCE_WORKER_INTERVAL_MS || 60000);
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await pollSequenceReplies(); await runEmailSequenceWorkerOnce(); }
    catch (error) { console.error('Email sequence worker failed:', error.message); }
    finally { running = false; }
  };
  setTimeout(run, 5000);
  const timer = setInterval(run, Number.isFinite(intervalMs) && intervalMs >= 10000 ? intervalMs : 60000);
  console.log("Email sequence worker started");
  return timer;
};

module.exports = {
  runEmailSequenceWorkerOnce,
  scheduleForStep,
  sendCommunication,
  startEmailSequenceWorker,
};

