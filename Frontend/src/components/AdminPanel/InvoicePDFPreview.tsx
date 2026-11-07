import { useEffect, useState } from "react";
import axios from "axios";
import { DownloadCloud } from "lucide-react";

type InvoicePDFPreviewProps = {
    invoice: Record<string, unknown>;
    onDownload: () => void;
};

export default function InvoicePDFPreview({ invoice, onDownload }: InvoicePDFPreviewProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        setLoading(true);
        setError(false);
        // Generate after typing settles, using the same renderer as downloads and email attachments.
        const timer = window.setTimeout(async () => {
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/invoices/preview-download`,
                    invoice,
                    { responseType: "blob", signal: controller.signal }
                );
                if (active) setPdfUrl(URL.createObjectURL(new Blob([response.data], { type: "application/pdf" })));
            } catch (requestError) {
                if (active && !axios.isCancel(requestError)) setError(true);
            } finally {
                if (active) setLoading(false);
            }
        }, 400);
        return () => {
            active = false;
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [invoice, retry]);

    useEffect(() => () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    }, [pdfUrl]);

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" aria-label="Invoice preview">
            <div className="flex items-center justify-between gap-3 bg-slate-800 p-3 text-xs font-bold uppercase tracking-widest text-white">
                <span>Live Invoice Preview</span>
                <button type="button" onClick={onDownload}
                    className="flex items-center gap-1.5 rounded bg-white/10 px-2 py-1 transition-colors hover:bg-white/20"
                    title="Download Preview PDF">
                    <DownloadCloud size={14} /> Download
                </button>
            </div>
            <div className="relative aspect-[210/297] bg-white" aria-busy={loading}>
                {pdfUrl && <iframe title="Invoice PDF preview" src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                    className="absolute inset-0 h-full w-full border-0" />}
                {loading && <div role="status" className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-sm text-slate-500">Updating invoice preview...</div>}
                {error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white p-6 text-center text-sm text-slate-600">
                    <p>Unable to load the invoice preview.</p>
                    <button type="button" onClick={() => setRetry(value => value + 1)}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">Retry preview</button>
                </div>}
            </div>
        </section>
    );
}
