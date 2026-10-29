const express = require('express');
const User = require('../models/Users');
const Leave = require('../models/Leaves');
const { protect } = require('../middleware/authMiddleware');
const { calculatePayroll } = require('../services/payrollCalculator');
const router = express.Router();

router.use(protect, (req, res, next) => {
  if (!req.user || req.user.isDisabled || !['Admin', 'Finance'].includes(req.user.designation)) return res.status(403).json({ message: 'Payroll is available only to Admin and Finance.' });
  next();
});

router.get('/employees', async (_req, res) => {
  try {
    const employees = await User.find().select('name email joinDate dateOfJoining designation').sort({ name: 1 }).lean();
    res.json({ employees: employees.map(employee => ({ _id: employee._id, name: employee.name, email: employee.email, designation: employee.designation, doj: employee.joinDate || employee.dateOfJoining || null })) });
  } catch { res.status(500).json({ message: 'Unable to load payroll employees.' }); }
});

router.post('/calculate', async (req, res) => {
  const { employeeId, periodNumber, salary, deductionDays } = req.body;
  if (typeof employeeId !== 'string' || !/^[a-f\d]{24}$/i.test(employeeId)) return res.status(400).json({ message: 'Select an employee.' });
  try {
    const employee = await User.findById(employeeId).select('joinDate dateOfJoining').lean();
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    let period;
    try { period = calculatePayroll({ doj: employee.joinDate || employee.dateOfJoining, periodNumber, salary, deductionDays }); }
    catch (error) { return res.status(400).json({ message: error.message }); }
    const leaves = await Leave.find({ user: employeeId, status: 'Approved', fromDate: { $lte: new Date(`${period.periodEnd}T23:59:59.999Z`) }, toDate: { $gte: new Date(`${period.periodStart}T00:00:00.000Z`) } }).select('fromDate toDate leaveCategory status').lean();
    res.json(calculatePayroll({ doj: employee.joinDate || employee.dateOfJoining, periodNumber, salary, deductionDays, leaves }));
  } catch { res.status(500).json({ message: 'Unable to calculate payroll. Check employee leave dates and try again.' }); }
});

module.exports = router;
