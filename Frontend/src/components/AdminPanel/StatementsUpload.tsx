import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
    CheckCircle2,
    Download,
    FileSpreadsheet,
    History,
    Info,
    RefreshCw,
    Search,
    Upload,
    X,
    Edit2,
    Trash2,
    Save
} from "lucide-react";

type UploadStatus = "idle" | "ready" | "success";

interface StatementRow {
    _id: string;
    bulkUploadId: string;
    accountNumber: string;
    date: string;
    transactionType: "debited" | "credited";
    amount: number;
    reason: string;
    uploadedAt: string;
    uploadedBy?: {
        name?: string;
        email?: string;
    };
}

interface UploadSummary {
    totalRows: number;
    savedRows: number;
    failedRows: number;
    duplicateRows: number;
    validationErrors: number;
    totalAmountDebited: number;
    totalAmountCredited: number;
}

interface UploadBatch {
    bulkUploadId: string;
    originalFilename: string;
    uploadedAt: string;
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    status: string;
    uploadedBy?: {
        name?: string;
        email?: string;
    };
}

interface BatchDetail {
    batch: UploadBatch;
    summary: {
        totalRows: number;
        rowsUploaded: number;
        failedRows: number;
        validationErrors: number;
        duplicateRows: number;
        totalAmountDebited: number;
        totalAmountCredited: number;
        ignoredEmptyRows: number;
        status: string;
    };
    statements: StatementRow[];
    validationErrors: Array<{ row: number; errors: string[] }>;
    duplicateRows: Array<{
        row: number;
        accountNumber: string;
        date: string;
        transactionType: string;
        amount: number;
        reason: string;
        errors: string[];
    }>;
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const StatementsUpload = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
    const [uploadMessage, setUploadMessage] = useState("Waiting for an Excel statement file.");
    const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
    const [statements, setStatements] = useState<StatementRow[]>([]);
    const [statementsLoading, setStatementsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStatements, setTotalStatements] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [transactionTypeFilter, setTransactionTypeFilter] = useState("");
    const [bulkUploadIdFilter, setBulkUploadIdFilter] = useState("");
    const [uploadedByFilter, setUploadedByFilter] = useState("");
    const [startDateFilter, setStartDateFilter] = useState("");
    const [endDateFilter, setEndDateFilter] = useState("");
    const [batches, setBatches] = useState<UploadBatch[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(false);
    const [batchPage, setBatchPage] = useState(1);
    const [batchTotalPages, setBatchTotalPages] = useState(1);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [selectedBatch, setSelectedBatch] = useState<BatchDetail | null>(null);
    const [batchLoading, setBatchLoading] = useState(false);
    
    const [editingStatementId, setEditingStatementId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<StatementRow>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchStatements = async (targetPage = page) => {
        setStatementsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/statements`, {
                params: {
                    page: targetPage,
                    limit: 10,
                    search: searchTerm || undefined,
                    transactionType: transactionTypeFilter || undefined,
                    bulkUploadId: bulkUploadIdFilter || undefined,
                    uploadedBy: uploadedByFilter || undefined,
                    startDate: startDateFilter || undefined,
                    endDate: endDateFilter || undefined,
                },
            });

            setStatements(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
            setTotalStatements(response.data.pagination?.total || 0);
            setPage(response.data.pagination?.page || targetPage);
        } catch (error) {
            console.error("Failed to fetch uploaded statements:", error);
            setStatements([]);
        } finally {
            setStatementsLoading(false);
        }
    };

    const fetchBatches = async (targetPage = batchPage) => {
        setBatchesLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/statements/batches`, {
                params: { page: targetPage, limit: 10 },
            });
            setBatches(response.data.data || []);
            setBatchTotalPages(response.data.pagination?.totalPages || 1);
            setBatchPage(response.data.pagination?.page || targetPage);
        } catch (error) {
            console.error("Failed to fetch upload history:", error);
            setBatches([]);
        } finally {
            setBatchesLoading(false);
        }
    };

    const fetchBatchDetail = async (bulkUploadId: string) => {
        setSelectedBatchLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/statements/batches/${bulkUploadId}`);
            setSelectedBatch(response.data);
        } catch (error) {
            console.error("Failed to fetch upload batch details:", error);
            setSelectedBatch(null);
        } finally {
            setSelectedBatchLoading(false);
        }
    };

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            fetchStatements(1);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchTerm, transactionTypeFilter, bulkUploadIdFilter, uploadedByFilter, startDateFilter, endDateFilter]);

    useEffect(() => {
        fetchBatches(1);
    }, []);

    const handleFileSelect = (file?: File) => {
        if (!file) return;
        setSelectedFile(file);
        setUploadStatus("ready");
        setUploadMessage("File selected. Click Upload to continue.");
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(event.target.files?.[0]);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        handleFileSelect(event.dataTransfer.files?.[0]);
    };

    const clearSelectedFile = (resetStatus = true) => {
        setSelectedFile(null);
        if (resetStatus) {
            setUploadStatus("idle");
            setUploadMessage("Waiting for an Excel statement file.");
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/statements/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setUploadStatus("success");
            setUploadMessage(response.data.message || "Statement uploaded successfully.");
            setUploadSummary(response.data.summary || null);
            clearSelectedFile(false);
            fetchStatements(1);
            fetchBatches(1);
        } catch (error: any) {
            setUploadStatus("ready");
            setUploadMessage(error.response?.data?.message || "Statement upload failed.");
        }
    };

    const handleEditClick = (statement: StatementRow) => {
        setEditingStatementId(statement._id);
        setEditForm({
            accountNumber: statement.accountNumber,
            date: statement.date ? new Date(statement.date).toISOString().split("T")[0] : "",
            transactionType: statement.transactionType,
            amount: statement.amount,
            reason: statement.reason,
        });
    };

    const handleSaveEdit = async () => {
        if (!editingStatementId) return;
        try {
            await axios.put(`${API_BASE_URL}/api/statements/${editingStatementId}`, editForm, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setEditingStatementId(null);
            fetchStatements(page);
        } catch (error) {
            console.error("Failed to update statement", error);
            alert("Failed to update statement. It may be a duplicate.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this statement?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/statements/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            fetchStatements(page);
        } catch (error) {
            console.error("Failed to delete statement", error);
        }
    };

    const handleDownloadSample = () => {
        const sampleData = [
            { "account number": "0012345678", date: "2023-10-01", type: "Debit", amount: 2500, reason: "Office Rent" },
            { "account number": "0098765432", date: "2023-10-02", type: "Credit", amount: 15000, reason: "Client Payment" },
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Statements");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "sample-statement-upload.xlsx";
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatUploadedDate = (value: string) => {
        if (!value) return "-";
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    };

    const formatDate = (value: string) => {
        if (!value) return "-";
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(new Date(value));
    };

    const formatCurrency = (amount?: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount || 0));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileSpreadsheet size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-800">Statements Upload</h1>
                            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
                                Upload bank or finance statement Excel files for review. Backend processing will be connected later.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 lg:w-auto"
                >
                    <Download size={18} />
                    Download Sample Excel
                </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-all ${isDragging
                            ? "border-blue-400 bg-blue-50"
                            : "border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-blue-50/40"
                            }`}
                    >
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                            <Upload size={30} />
                        </div>
                        <h2 className="text-lg font-black text-slate-800">Upload Excel Statement</h2>
                        <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                            Drag and drop an Excel file here, or browse from your device.
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                            Supported: .xlsx, .xls
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleInputChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-6 rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-900 active:scale-95"
                        >
                            Choose File
                        </button>
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Selected filename</p>
                                {selectedFile ? (
                                    <div className="mt-2 flex min-w-0 items-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5 flex-none text-emerald-600" />
                                        <span className="truncate text-sm font-bold text-slate-800">{selectedFile.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => clearSelectedFile()}
                                            className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-red-500"
                                            aria-label="Remove selected file"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm font-medium text-slate-500">No file selected yet.</p>
                                )}
                            </div>

                            <button
                                type="button"
                                disabled={!selectedFile}
                                onClick={handleUpload}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto"
                            >
                                <Upload size={18} />
                                Upload
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-800">Upload Status</h2>
                                <p className="text-xs font-medium text-slate-500">Latest upload result</p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <p className={`text-sm font-bold ${uploadStatus === "success" ? "text-emerald-700" : uploadStatus === "ready" ? "text-blue-700" : "text-slate-500"}`}>
                                {uploadMessage}
                            </p>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Info size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-800">Upload Summary</h2>
                                <p className="text-xs font-medium text-slate-500">Latest upload summary</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Total Rows", value: uploadSummary?.totalRows },
                                { label: "Saved Rows", value: uploadSummary?.savedRows },
                                { label: "Duplicates", value: uploadSummary?.duplicateRows },
                                { label: "Errors", value: uploadSummary?.validationErrors },
                                { label: "Amount Debited", value: uploadSummary ? formatCurrency(uploadSummary.totalAmountDebited) : undefined },
                                { label: "Amount Credited", value: uploadSummary ? formatCurrency(uploadSummary.totalAmountCredited) : undefined },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{item.label}</p>
                                    <p className="mt-2 text-xl font-black text-slate-700">{item.value ?? "--"}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-800">Upload History</h2>
                            <p className="text-xs font-medium text-slate-500">Previous statement upload batches</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => fetchBatches(batchPage)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        <RefreshCw size={16} className={batchesLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                            <tr>
                                <th className="px-5 py-4">Bulk Upload ID</th>
                                <th className="px-5 py-4">Filename</th>
                                <th className="px-5 py-4">Uploaded By</th>
                                <th className="px-5 py-4">Upload Date</th>
                                <th className="px-5 py-4 text-right">Rows Uploaded</th>
                                <th className="px-5 py-4 text-right">Failed Rows</th>
                                <th className="px-5 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batchesLoading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <tr key={index} className="border-t border-slate-100">
                                        {Array.from({ length: 7 }).map((__, cellIndex) => (
                                            <td key={cellIndex} className="px-5 py-4">
                                                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : batches.length ? (
                                batches.map((batch) => (
                                    <tr
                                        key={batch.bulkUploadId}
                                        onClick={() => fetchBatchDetail(batch.bulkUploadId)}
                                        className={`cursor-pointer border-t border-slate-100 transition-colors hover:bg-blue-50/50 ${selectedBatch?.batch.bulkUploadId === batch.bulkUploadId ? "bg-blue-50" : ""}`}
                                    >
                                        <td className="px-5 py-4 text-sm font-black text-blue-700">{batch.bulkUploadId}</td>
                                        <td className="max-w-[240px] truncate px-5 py-4 text-sm font-bold text-slate-700">{batch.originalFilename}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-slate-700">{batch.uploadedBy?.name || batch.uploadedBy?.email || "-"}</td>
                                        <td className="px-5 py-4 text-sm font-medium text-slate-500">{formatUploadedDate(batch.uploadedAt)}</td>
                                        <td className="px-5 py-4 text-right text-sm font-black text-emerald-700">{batch.successfulRows}</td>
                                        <td className="px-5 py-4 text-right text-sm font-black text-red-700">{batch.failedRows}</td>
                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${batch.status === "completed" ? "bg-emerald-50 text-emerald-700" : batch.status === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                                {batch.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                                        No upload history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-bold text-slate-500">Page {batchPage} of {batchTotalPages}</p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={batchPage <= 1 || batchesLoading}
                            onClick={() => fetchBatches(batchPage - 1)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={batchPage >= batchTotalPages || batchesLoading}
                            onClick={() => fetchBatches(batchPage + 1)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {(selectedBatch || batchLoading) && (
                <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <h2 className="text-base font-black text-slate-800">Batch Details</h2>
                        <p className="text-xs font-medium text-slate-500">
                            {batchLoading ? "Loading batch details..." : selectedBatch?.batch.bulkUploadId}
                        </p>
                    </div>
                    {selectedBatch && !batchLoading && (
                        <div className="space-y-5 p-5">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                                {[
                                    { label: "Total Rows", value: selectedBatch.summary.totalRows },
                                    { label: "Uploaded", value: selectedBatch.summary.rowsUploaded },
                                    { label: "Failed", value: selectedBatch.summary.failedRows },
                                    { label: "Duplicates", value: selectedBatch.summary.duplicateRows },
                                    { label: "Errors", value: selectedBatch.summary.validationErrors },
                                    { label: "Amount Debited", value: formatCurrency(selectedBatch.summary.totalAmountDebited) },
                                    { label: "Amount Credited", value: formatCurrency(selectedBatch.summary.totalAmountCredited) },
                                    { label: "Empty Rows", value: selectedBatch.summary.ignoredEmptyRows },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{item.label}</p>
                                        <p className="mt-2 text-xl font-black text-slate-800">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-5 xl:grid-cols-3">
                                <div className="xl:col-span-3">
                                    <h3 className="mb-2 text-sm font-black text-slate-800">Uploaded Statements</h3>
                                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                                        <table className="w-full min-w-[760px] text-left">
                                            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                                <tr>
                                                    <th className="px-4 py-3">Account Number</th>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                    <th className="px-4 py-3">Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedBatch.statements.length ? selectedBatch.statements.map((statement) => (
                                                    <tr key={statement._id} className="border-t border-slate-100">
                                                        <td className="px-4 py-3 font-mono text-sm font-bold text-slate-700">{statement.accountNumber}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-slate-700">{formatDate(statement.date)}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-slate-700">{statement.transactionType}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-black text-slate-700">{formatCurrency(statement.amount)}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-600">{statement.reason}</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No statements uploaded in this batch.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="xl:col-span-3">
                                    <h3 className="mb-2 text-sm font-black text-slate-800">Validation Errors</h3>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        {selectedBatch.validationErrors.length ? selectedBatch.validationErrors.map((item) => (
                                            <p key={item.row} className="mb-2 text-sm font-medium text-red-700">Row {item.row}: {item.errors.join(", ")}</p>
                                        )) : <p className="text-sm font-medium text-slate-500">No validation errors.</p>}
                                    </div>
                                </div>

                                <div className="xl:col-span-3">
                                    <h3 className="mb-2 text-sm font-black text-slate-800">Duplicate Rows</h3>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        {selectedBatch.duplicateRows.length ? selectedBatch.duplicateRows.map((item) => (
                                            <p key={item.row} className="mb-2 text-sm font-medium text-amber-700">Row {item.row}: {item.accountNumber} - {formatDate(item.date)} - {item.transactionType} - {formatCurrency(item.amount)} - {item.reason}</p>
                                        )) : <p className="text-sm font-medium text-slate-500">No duplicate rows.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-800">Uploaded Statements</h2>
                            <p className="text-xs font-medium text-slate-500">{totalStatements} statement rows found</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => fetchStatements(page)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        <RefreshCw size={16} className={statementsLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-2 xl:grid-cols-6">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search upload ID, account, type, reason"
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <select
                        value={transactionTypeFilter}
                        onChange={(event) => setTransactionTypeFilter(event.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="">All Types</option>
                        <option value="debited">Debited</option>
                        <option value="credited">Credited</option>
                    </select>
                    <input
                        type="text"
                        value={bulkUploadIdFilter}
                        onChange={(event) => setBulkUploadIdFilter(event.target.value)}
                        placeholder="Bulk Upload ID"
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        value={uploadedByFilter}
                        onChange={(event) => setUploadedByFilter(event.target.value)}
                        placeholder="Uploaded By ID"
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            value={startDateFilter}
                            onChange={(event) => setStartDateFilter(event.target.value)}
                            className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                            type="date"
                            value={endDateFilter}
                            onChange={(event) => setEndDateFilter(event.target.value)}
                            className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] text-left">
                        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                            <tr>
                                <th className="px-5 py-4">Bulk Upload ID</th>
                                <th className="px-5 py-4">Account Number</th>
                                <th className="px-5 py-4">Date</th>
                                <th className="px-5 py-4">Type</th>
                                <th className="px-5 py-4 text-right">Amount</th>
                                <th className="px-5 py-4">Reason</th>
                                <th className="px-5 py-4">Uploaded By</th>
                                <th className="px-5 py-4">Uploaded Date</th>
                                <th className="px-5 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statementsLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} className="border-t border-slate-100">
                                        {Array.from({ length: 9 }).map((__, cellIndex) => (
                                            <td key={cellIndex} className="px-5 py-4">
                                                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : statements.length ? (
                                statements.map((statement) => (
                                    <tr key={statement._id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                                        <td className="px-5 py-4 text-sm font-black text-blue-700">{statement.bulkUploadId}</td>
                                        {editingStatementId === statement._id ? (
                                            <>
                                                <td className="px-5 py-4"><input type="text" value={editForm.accountNumber || ""} onChange={e => setEditForm({...editForm, accountNumber: e.target.value})} className="w-full rounded border px-2 py-1 text-sm font-bold text-slate-700" /></td>
                                                <td className="px-5 py-4"><input type="date" value={editForm.date || ""} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full rounded border px-2 py-1 text-sm font-bold text-slate-700" /></td>
                                                <td className="px-5 py-4">
                                                    <select value={editForm.transactionType} onChange={e => setEditForm({...editForm, transactionType: e.target.value as any})} className="w-full rounded border px-2 py-1 text-[11px] font-black uppercase">
                                                        <option value="debited">DEBITED</option>
                                                        <option value="credited">CREDITED</option>
                                                    </select>
                                                </td>
                                                <td className="px-5 py-4"><input type="number" value={editForm.amount || ""} onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})} className="w-full rounded border px-2 py-1 text-right text-sm font-black text-slate-700" /></td>
                                                <td className="px-5 py-4"><input type="text" value={editForm.reason || ""} onChange={e => setEditForm({...editForm, reason: e.target.value})} className="w-full rounded border px-2 py-1 text-sm font-medium text-slate-700" /></td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-5 py-4 font-mono text-sm font-bold text-slate-700">{statement.accountNumber}</td>
                                                <td className="px-5 py-4 text-sm font-bold text-slate-700">{formatDate(statement.date)}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${statement.transactionType === "credited" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                                        {statement.transactionType}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right text-sm font-black text-slate-700">{formatCurrency(statement.amount)}</td>
                                                <td className="max-w-[280px] truncate px-5 py-4 text-sm font-medium text-slate-700">{statement.reason}</td>
                                            </>
                                        )}
                                        <td className="px-5 py-4 text-sm font-bold text-slate-700">{statement.uploadedBy?.name || statement.uploadedBy?.email || "-"}</td>
                                        <td className="px-5 py-4 text-sm font-medium text-slate-500">{formatUploadedDate(statement.uploadedAt)}</td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {editingStatementId === statement._id ? (
                                                    <>
                                                        <button onClick={handleSaveEdit} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50" title="Save"><Save size={16} /></button>
                                                        <button onClick={() => setEditingStatementId(null)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100" title="Cancel"><X size={16} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleEditClick(statement)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" title="Edit"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDelete(statement._id)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Delete"><Trash2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                                        No uploaded statements found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-bold text-slate-500">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || statementsLoading}
                            onClick={() => fetchStatements(page - 1)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={page >= totalPages || statementsLoading}
                            onClick={() => fetchStatements(page + 1)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StatementsUpload;
