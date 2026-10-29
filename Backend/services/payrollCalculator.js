const DAY = 86400000;
const dateOnly = value => {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value || '').slice(0, 10);
  const date = Date.parse(text);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(date) || new Date(date).toISOString().slice(0, 10) !== text) throw new Error('Employee needs a valid date of joining.');
  return date;
};

const calculatePayroll = ({ doj, periodNumber, salary, deductionDays, leaves = [] }) => {
  if (!Number.isInteger(periodNumber) || periodNumber < 1 || periodNumber > 1200) throw new Error('Select a valid payroll period (1–1200).');
  if (typeof salary !== 'number' || !Number.isFinite(salary) || salary < 0 || salary > 100000000 || Math.abs(salary * 100 - Math.round(salary * 100)) > 0.00001) throw new Error('Enter a salary between 0 and 100,000,000 with at most two decimal places.');
  const start = dateOnly(doj) + (periodNumber - 1) * 30 * DAY;
  const end = start + 29 * DAY;
  const leaveByDay = new Map();
  for (const leave of leaves) {
    if (leave.status !== 'Approved') continue;
    const from = Math.max(start, dateOnly(leave.fromDate));
    const to = Math.min(end, dateOnly(leave.toDate));
    for (let day = from; day <= to; day += DAY) {
      leaveByDay.set(day, Math.min(1, (leaveByDay.get(day) || 0) + (leave.leaveCategory === 'Half Day' ? 0.5 : 1)));
    }
  }
  const leaveDays = [...leaveByDay.values()].reduce((total, days) => total + days, 0);
  const days = deductionDays === undefined ? leaveDays : deductionDays;
  if (typeof days !== 'number' || !Number.isFinite(days) || days < 0 || days > 30 || !Number.isInteger(days * 2)) throw new Error('Deduction days must be 0–30 in half-day increments.');
  const salaryCents = Math.round(salary * 100);
  const deductionCents = Math.round(salaryCents * days / 30);
  return { periodNumber, periodStart: new Date(start).toISOString().slice(0, 10), periodEnd: new Date(end).toISOString().slice(0, 10), salary, leaveDays, deductionDays: days, deduction: deductionCents / 100, netPay: (salaryCents - deductionCents) / 100 };
};

module.exports = { calculatePayroll };
