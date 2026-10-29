import { useEffect, useState } from 'react';
import axios from 'axios';

type Employee = { _id: string; name: string; email: string; doj: string | null };
type Result = { periodStart: string; periodEnd: string; salary: number; leaveDays: number; deductionDays: number; deduction: number; netPay: number };
const api = `${import.meta.env.VITE_BACKEND_URL}/api/payroll`;
const money = (value: number) => value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Payroll() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [period, setPeriod] = useState('1');
  const [salary, setSalary] = useState('');
  const [days, setDays] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const employee = employees.find(item => item._id === employeeId);

  useEffect(() => {
    const controller = new AbortController();
    axios.get(`${api}/employees`, { signal: controller.signal }).then(({ data }) => setEmployees(data.employees))
      .catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message || 'Unable to load employees. Reopen the page to retry.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const calculate = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setResult(null);
    try {
      const { data } = await axios.post(api + '/calculate', { employeeId, periodNumber: Number(period), salary: Number(salary), ...(days === '' ? {} : { deductionDays: Number(days) }) });
      setResult(data);
    } catch (error: any) { setError(error.response?.data?.message || 'Unable to calculate payroll. Please try again.'); }
    finally { setBusy(false); }
  };

  return <details className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <summary className="cursor-pointer text-lg font-bold text-slate-800">Payroll · Admin & Finance</summary>
    <p className="mt-3 text-sm text-slate-500">Each period is 30 calendar days from DOJ. Approved leaves are counted automatically, including half-days. Override deduction days if needed. Salary and adjustments are used for this calculation only and are not saved.</p>
    <form onSubmit={calculate} className="mt-4">
      <fieldset disabled={busy || loading} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 disabled:opacity-60">
        <label className="text-sm font-semibold text-slate-700">Employee
          <select required value={employeeId} onChange={event => { setEmployeeId(event.target.value); setResult(null); setSalary(''); setDays(''); setPeriod('1'); }} className="mt-1 w-full rounded-lg border border-slate-300 p-2">
            <option value="">{loading ? 'Loading employees…' : 'Select employee'}</option>
            {employees.map(item => <option key={item._id} value={item._id}>{item.name} — {item.email}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">30-day period number
          <input type="number" min="1" max="1200" step="1" required value={period} onChange={event => { setPeriod(event.target.value); setResult(null); }} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
          <span className="mt-1 block text-xs font-normal text-slate-500">1 = first 30 days from DOJ, 2 = next 30 days.</span>
        </label>
        <label className="text-sm font-semibold text-slate-700">Monthly salary
          <input type="number" min="0" max="100000000" step="0.01" required value={salary} onChange={event => { setSalary(event.target.value); setResult(null); }} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">Deduction days (optional)
          <input type="number" min="0" max="30" step="0.5" value={days} placeholder="Use approved leave days" onChange={event => { setDays(event.target.value); setResult(null); }} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          {employee && <p className="mb-3 text-sm text-slate-600">DOJ: {employee.doj ? employee.doj.slice(0, 10) : 'Not set — ask an admin to update the employee in User Management.'}</p>}
          <button disabled={!employee?.doj || loading || busy} type="submit" className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Calculating…' : 'Calculate payroll'}</button>
        </div>
      </fieldset>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {result && <div role="status" className="mt-5 rounded-xl bg-slate-50 p-4">
      <p className="mb-3 font-semibold text-slate-800">Period: {result.periodStart} to {result.periodEnd} (30 days)</p>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[['Monthly salary', money(result.salary)], ['Approved leave days', result.leaveDays], ['Deduction days', result.deductionDays], ['Leave deduction', money(result.deduction)], ['Net pay', money(result.netPay)]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-lg font-bold text-slate-900">{value}</dd></div>)}
      </dl>
      <p className="mt-3 text-xs text-slate-500">Net pay = monthly salary − (monthly salary ÷ 30 × deduction days). No other deductions are included.</p>
    </div>}
  </details>;
}
