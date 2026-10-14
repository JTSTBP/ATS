import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Mail, RefreshCw } from "lucide-react";

const api = `${import.meta.env.VITE_BACKEND_URL}/api/microsoft-mail`;
type Connection = { configured: boolean; connected: boolean; email: string; provider: string; microsoftRequired: boolean };

export default function EmailConnection() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const popup = useRef<Window | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const load = useCallback(async () => {
    try { const { data } = await axios.get(api + "/status"); setConnection(data); }
    catch { setMessage("Unable to check your email connection. Try refreshing the status."); }
  }, []);

  useEffect(() => {
    load();
    const receive = (event: MessageEvent) => {
      if (event.origin !== new URL(api, window.location.origin).origin || event.source !== popup.current || event.data?.type !== "ats-microsoft-mail") return;
      setMessage(event.data.message || "Microsoft connection updated");
      setBusy(false);
      load();
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
    };
    window.addEventListener("message", receive);
    return () => { window.removeEventListener("message", receive); if (timer.current) clearInterval(timer.current); };
  }, [load]);

  const connect = async () => {
    const win = window.open("", "ats-microsoft-mail", "width=540,height=720");
    if (!win) { setMessage("Allow pop-ups for this site to connect your Microsoft email."); return; }
    popup.current = win;
    setBusy(true); setMessage("");
    try {
      const { data } = await axios.post(api + "/connect");
      win.location.href = data.url;
      const started = Date.now();
      timer.current = setInterval(() => {
        if (win.closed || Date.now() - started > 10 * 60 * 1000) {
          if (timer.current) { clearInterval(timer.current); timer.current = null; }
          setBusy(false); load();
        }
      }, 1000);
    } catch (error: any) { win.close(); setBusy(false); setMessage(error.response?.data?.message || "Unable to start Microsoft sign-in."); }
  };

  const disconnect = async () => {
    setBusy(true);
    try { await axios.delete(api + "/connection"); setMessage("Microsoft disconnected. Scheduled emails will need a valid sending connection."); await load(); }
    catch { setMessage("Unable to disconnect. Please try again."); }
    finally { setBusy(false); }
  };

  return <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Mail size={16} />Sending account</h3>
        <p className="mt-1 break-all text-sm text-slate-600">{connection?.email || "Checking account…"}</p>
        {connection && <p className="mt-1 text-xs text-slate-500">{connection.connected && connection.provider === "microsoft" ? "Microsoft connected · sends from your mailbox" : connection.microsoftRequired ? "Connect Microsoft to send from this mailbox" : "Uses the app password saved in your user profile"}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Refresh email connection" onClick={load} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"><RefreshCw size={16} /></button>
        {connection?.connected && connection.provider === "microsoft" ? <>
          <button type="button" disabled={busy || !connection.configured} onClick={connect} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50">Reconnect</button>
          <button type="button" disabled={busy} onClick={disconnect} className="rounded-lg px-3 py-2 text-sm text-red-600 disabled:opacity-50">Disconnect</button>
        </> : <button type="button" disabled={busy || !connection?.configured} onClick={connect} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Waiting for Microsoft…" : "Connect Outlook / Microsoft 365"}</button>}
      </div>
    </div>
    {connection && !connection.configured && <p className="mt-3 text-xs text-amber-700">Microsoft sign-in requires administrator setup. Your existing app-password email remains available for supported accounts.</p>}
    {message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}
  </section>;
}
