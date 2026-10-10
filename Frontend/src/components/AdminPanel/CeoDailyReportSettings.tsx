import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, Download, Eye, Mail, RefreshCw, Save, Send, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_BACKEND_URL;

type Settings = {
  enable12PmReport: boolean;
  enable7PmReport: boolean;
  emailRecipients: string[];
  ccRecipients: string[];
  timezone: string;
  dashboardUrl: string;
};

type ReportLog = {
  _id: string;
  reportDate: string;
  reportSlot: "12PM" | "7PM";
  generatedAt: string;
  emailStatus: string;
  status: string;
  subject: string;
  html?: string;
};

type Delivery = {
  status?: string;
  emailStatus?: string;
  emailError?: string;
};

const defaultSettings: Settings = {
  enable12PmReport: true,
  enable7PmReport: true,
  emailRecipients: [],
  ccRecipients: [],
  timezone: "Asia/Kolkata",
  dashboardUrl: "",
};

const asText = (items: string[]) => items.join(", ");
const asList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

const getEmailErrorMessage = (emailError?: string) => {
  if (!emailError) return "";
  try {
    const parsed = JSON.parse(emailError);
    const code = parsed.code ? `${parsed.code}: ` : "";
    return `${code}${parsed.message || emailError}`;
  } catch {
    return emailError;
  }
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(value));
}

export default function CeoDailyReportSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [ccRecipients, setCcRecipients] = useState("");
  const [history, setHistory] = useState<ReportLog[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadSettings = async () => {
    const response = await axios.get(`${API_URL}/api/ceo-daily-reports/settings`);
    const next = { ...defaultSettings, ...response.data.settings };
    setSettings(next);
    setEmailRecipients(asText(next.emailRecipients || []));
    setCcRecipients(asText(next.ccRecipients || []));
  };

  const loadHistory = async () => {
    const response = await axios.get(`${API_URL}/api/ceo-daily-reports/history`);
    const logs = response.data.logs || [];
    setHistory(logs);
    setSelectedHistoryIds((current) => current.filter((id) => logs.some((log: ReportLog) => log._id === id)));
  };

  const refresh = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSettings(), loadHistory()]);
    } catch {
      toast.error("Failed to load CEO report settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const saveSettings = async () => {
    try {
      const payload = {
        ...settings,
        emailRecipients: asList(emailRecipients),
        ccRecipients: asList(ccRecipients),
      };
      const response = await axios.put(`${API_URL}/api/ceo-daily-reports/settings`, payload);
      const next = { ...defaultSettings, ...response.data.settings };
      setSettings(next);
      toast.success("CEO daily report settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const sendAction = async (label: string, endpoint: string, body: Record<string, unknown>) => {
    setSending(label);
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, body);
      if (response.data.skipped) {
        toast.info(response.data.reason || "Report skipped");
      } else {
        const delivery: Delivery = response.data.delivery || response.data.log || {};
        const statusText = `Email: ${delivery.emailStatus || "unknown"}`;
        const errorText = getEmailErrorMessage(delivery.emailError);
        if (delivery.status === "success") {
          toast.success(`${label} sent. ${statusText}`);
        } else if (delivery.status === "partial") {
          toast.warn(`${label} partially sent. ${statusText}${errorText ? ` - ${errorText}` : ""}`);
        } else {
          toast.error(`${label} not sent. ${statusText}${errorText ? ` - ${errorText}` : ""}`);
        }
      }
      await loadHistory();
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : "";
      toast.error(message || `${label} failed`);
    } finally {
      setSending("");
    }
  };

  const openReport = async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/ceo-daily-reports/history/${id}`);
      setSelectedReport(response.data.log);
    } catch {
      toast.error("Unable to open report");
    }
  };

  const downloadReportPdf = async (report: ReportLog) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/ceo-daily-reports/history/${report._id}/pdf`,
        {
          responseType: "blob",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ATS_Daily_Performance_Report_${report.reportSlot}_${report.reportDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      let message = "";
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (data instanceof Blob) {
          const text = await data.text();
          try {
            message = JSON.parse(text).message || text;
          } catch {
            message = text;
          }
        } else {
          message = data?.message || "";
        }
      }
      toast.error(message || "Unable to download PDF");
    }
  };

  const deleteReportHistory = async (report: ReportLog) => {
    const reportLabel = report.reportSlot === "7PM" ? "7 PM" : "12 PM";
    const confirmed = window.confirm(`Clear this ${reportLabel} report history for ${formatDate(report.reportDate)}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(report._id);
    try {
      await axios.delete(`${API_URL}/api/ceo-daily-reports/history/${report._id}`);
      if (selectedReport?._id === report._id) setSelectedReport(null);
      setHistory((current) => current.filter((item) => item._id !== report._id));
      setSelectedHistoryIds((current) => current.filter((id) => id !== report._id));
      toast.success("Report history cleared");
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : "";
      toast.error(message || "Unable to clear report history");
    } finally {
      setDeletingId("");
    }
  };

  const toggleHistorySelection = (id: string) => {
    setSelectedHistoryIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const toggleAllHistorySelection = () => {
    const visibleIds = history.map((report) => report._id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedHistoryIds.includes(id));
    setSelectedHistoryIds(allSelected ? [] : visibleIds);
  };

  const bulkDeleteReportHistory = async () => {
    if (selectedHistoryIds.length === 0) {
      toast.info("Select report history rows first");
      return;
    }

    const confirmed = window.confirm(`Clear ${selectedHistoryIds.length} selected report history record${selectedHistoryIds.length === 1 ? "" : "s"}? This cannot be undone.`);
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const response = await axios.delete(`${API_URL}/api/ceo-daily-reports/history/bulk`, {
        data: { ids: selectedHistoryIds },
      });
      const deletedIds = new Set(selectedHistoryIds);
      if (selectedReport && deletedIds.has(selectedReport._id)) setSelectedReport(null);
      setHistory((current) => current.filter((item) => !deletedIds.has(item._id)));
      setSelectedHistoryIds([]);
      toast.success(response.data.message || "Selected report history cleared");
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : "";
      toast.error(message || "Unable to clear selected report history");
    } finally {
      setBulkDeleting(false);
    }
  };

  const allHistorySelected = history.length > 0 && history.every((report) => selectedHistoryIds.includes(report._id));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">CEO Daily Report Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Configure 12 PM and 7 PM ATS performance reports for email delivery.</p>
        </div>
        <button onClick={refresh} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <span>
              <span className="block font-bold text-slate-800">Enable 12 PM Report</span>
              <span className="text-sm text-slate-500">Sends start of day to 12:00 PM activity.</span>
            </span>
            <input type="checkbox" checked={settings.enable12PmReport} onChange={(event) => setSettings({ ...settings, enable12PmReport: event.target.checked })} className="h-5 w-5" />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <span>
              <span className="block font-bold text-slate-800">Enable 7 PM Report</span>
              <span className="text-sm text-slate-500">Sends full day activity up to 7:00 PM.</span>
            </span>
            <input type="checkbox" checked={settings.enable7PmReport} onChange={(event) => setSettings({ ...settings, enable7PmReport: event.target.checked })} className="h-5 w-5" />
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">CEO email recipients</span>
            <textarea value={emailRecipients} onChange={(event) => setEmailRecipients(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="ceo@example.com, management@example.com" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">CC recipients</span>
            <textarea value={ccRecipients} onChange={(event) => setCcRecipients(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="hr@example.com" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Report timezone</span>
              <input value={settings.timezone} onChange={(event) => setSettings({ ...settings, timezone: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Dashboard link</span>
              <input value={settings.dashboardUrl || ""} onChange={(event) => setSettings({ ...settings, dashboardUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="https://ats.example.com/Admin" />
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={saveSettings} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Save size={16} /> Save Settings
          </button>
          <button disabled={Boolean(sending)} onClick={() => sendAction("Generate 12 PM Report Now", "/api/ceo-daily-reports/send/12PM", { force: true })} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            <Clock size={16} /> Generate 12 PM Report Now
          </button>
          <button disabled={Boolean(sending)} onClick={() => sendAction("Generate 7 PM Report Now", "/api/ceo-daily-reports/send/7PM", { force: true })} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            <Clock size={16} /> Generate 7 PM Report Now
          </button>
          <button disabled={Boolean(sending)} onClick={() => sendAction("Send Test Email", "/api/ceo-daily-reports/test-email", { slot: "12PM" })} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <Mail size={16} /> Send Test Email
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-slate-900">Report History</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {selectedHistoryIds.length > 0 ? `${selectedHistoryIds.length} selected` : "Select rows to clear multiple history records"}
              </p>
            </div>
            <button
              onClick={bulkDeleteReportHistory}
              disabled={selectedHistoryIds.length === 0 || bulkDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkDeleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Clear Selected
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allHistorySelected}
                    onChange={toggleAllHistorySelection}
                    aria-label="Select all report history"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Report</th>
                <th className="px-4 py-3">Generated Time</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((report) => (
                <tr key={report._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedHistoryIds.includes(report._id)}
                      onChange={() => toggleHistorySelection(report._id)}
                      aria-label={`Select ${report.reportSlot} report from ${formatDate(report.reportDate)}`}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatDate(report.reportDate)}</td>
                  <td className="px-4 py-3">{report.reportSlot === "7PM" ? "7 PM" : "12 PM"}</td>
                  <td className="px-4 py-3">{formatTime(report.generatedAt)}</td>
                  <td className="px-4 py-3 capitalize">{report.emailStatus.replace("_", " ")}</td>
                  <td className="px-4 py-3 capitalize">{report.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openReport(report._id)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="View report"><Eye size={16} /></button>
                      <button onClick={() => downloadReportPdf(report)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Download PDF"><Download size={16} /></button>
                      <button onClick={() => sendAction("Send Again", `/api/ceo-daily-reports/history/${report._id}/resend`, {})} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Send again"><Send size={16} /></button>
                      <button
                        onClick={() => deleteReportHistory(report)}
                        disabled={deletingId === report._id}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Clear history"
                      >
                        {deletingId === report._id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No CEO daily reports generated yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 p-4">
          <div className="mx-auto h-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h3 className="font-black text-slate-900">{selectedReport.subject}</h3>
                <p className="text-sm text-slate-500">{formatTime(selectedReport.generatedAt)}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button>
            </div>
            <iframe title="CEO daily report preview" srcDoc={selectedReport.html || ""} className="h-[calc(100%-73px)] w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
