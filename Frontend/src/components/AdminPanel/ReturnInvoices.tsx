import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, DownloadCloud, Search, Calendar, FileText, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { formatDate } from "../../utils/dateUtils";

interface Client {
    _id: string;
    companyName: string;
}

interface Candidate {
    _id: string;
    dynamicFields: {
        Name?: string;
        candidateName?: string;
        [key: string]: any;
    };
}

interface ReturnInvoice {
    _id: string;
    client: Client;
    candidate: Candidate;
    amount: number;
    reason: string;
    proofDocument: string;
    returnDate: string;
    status: string;
    createdAt: string;
    createdBy: {
        _id: string;
        name: string;
    };
}

export const ReturnInvoices = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [returnInvoices, setReturnInvoices] = useState<ReturnInvoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    

    const [dataLoading, setDataLoading] = useState(false);

    // Filters
    const [filterClient, setFilterClient] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    const [formData, setFormData] = useState({
        client: "",
        candidate: [] as string[],
        amount: "",
        reason: "",
        returnDate: new Date().toISOString().split('T')[0]
    });
    
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetchReturnInvoices();
        fetchClients();
        fetchCandidates();
    }, []);

    useEffect(() => {
        fetchReturnInvoices();
    }, [filterClient, filterStartDate, filterEndDate]);

    const fetchReturnInvoices = async () => {
        setDataLoading(true);
        try {
            const params = {
                client: filterClient,
                startDate: filterStartDate,
                endDate: filterEndDate
            };
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/return-invoices/all`, { params });
            setReturnInvoices(response.data);
        } catch (error) {
            console.error("Error fetching return invoices:", error);
            toast.error("Failed to fetch return invoices");
        } finally {
            setDataLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/clients`);
            if (response.data.success) {
                setClients(response.data.clients);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    const fetchCandidates = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/CandidatesJob`);
            if (response.data.success) {
                setCandidates(response.data.candidates);
            }
        } catch (error) {
            console.error("Error fetching candidates:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name !== "candidate") {
            setFormData({ ...formData, [name]: value });
        }
    };



    const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData({ ...formData, candidate: selected });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!proofFile) {
            toast.error("Please upload a proof document");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append("client", formData.client);
            data.append("candidate", JSON.stringify(formData.candidate));
            data.append("amount", formData.amount);
            data.append("reason", formData.reason);
            data.append("returnDate", formData.returnDate);
            data.append("proofDocument", proofFile);
            data.append("createdBy", user?._id || "");

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/return-invoices/create`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Return invoice created successfully");

            setFormData({
                client: "",
                candidate: [],
                amount: "",
                reason: "",
                returnDate: new Date().toISOString().split('T')[0]
            });
            setProofFile(null);
            fetchReturnInvoices();
        } catch (error) {
            console.error("Error creating return invoice:", error);
            toast.error("Failed to create return invoice");
        } finally {
            setLoading(false);
        }
    };
    // Preview Return Invoice PDF
    const handleDownloadReturnPreview = async () => {
        try {
            const previewData = {
                ...formData,
                client: clients.find(c => c._id === formData.client) || {},
                candidate: candidates.filter(c => formData.candidate?.includes(c._id)) || [],
                proofDocument: proofFile ? URL.createObjectURL(proofFile) : '',
            };
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/return-invoices/preview-download`, previewData, {
                responseType: 'blob',
            });
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            setPreviewUrl(url);
        } catch (error) {
            console.error('Error generating return invoice preview:', error);
            toast.error('Failed to generate return invoice preview');
        }
    };
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this return invoice?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/return-invoices/${id}`);
            toast.success("Return invoice deleted successfully");
            fetchReturnInvoices();
        } catch (error) {
            console.error("Error deleting return invoice:", error);
            toast.error("Failed to delete return invoice");
        }
    };

    const getCandidateName = (candidate: Candidate) => {
        if (!candidate || !candidate.dynamicFields) return 'Unknown';
        return candidate.dynamicFields.Name || candidate.dynamicFields.candidateName || 'Unknown';
    };

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Return Invoices</h1>
                    <p className="text-sm font-bold text-slate-400">Manage client refunds and proofs</p>
                </div>
                <button
                    onClick={() => navigate('/Admin/return-invoices/create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    Create Return Invoice
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <select
                            value={filterClient}
                            onChange={(e) => setFilterClient(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        >
                            <option value="">All Clients</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>{client.companyName}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                    <span className="text-slate-400 text-sm">to</span>
                    <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                </div>
                {(filterClient || filterStartDate || filterEndDate) && (
                    <button
                        onClick={() => { setFilterClient(''); setFilterStartDate(''); setFilterEndDate(''); }}
                        className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Client</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Candidate</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Reason</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Proof</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {dataLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : returnInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        No return invoices found
                                    </td>
                                </tr>
                            ) : (
                                returnInvoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-slate-700">
                                            {formatDate(invoice.returnDate)}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-800">
                                            {invoice.client?.companyName}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {getCandidateName(invoice.candidate)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={invoice.reason}>
                                            {invoice.reason}
                                        </td>
                                        <td className="p-4 text-sm font-black text-red-600">
                                            ₹{invoice.amount?.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            {invoice.proofDocument && (
                                                <a
                                                    href={invoice.proofDocument}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                    title="View Proof Document"
                                                >
                                                    <DownloadCloud className="w-4 h-4" />
                                                </a>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleDelete(invoice._id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        {/* Return Invoice Preview Overlay */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl h-[80vh] p-4 flex flex-col backdrop-blur-lg bg-white/80 border border-gray-200 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold">Return Invoice Preview</h2>
                <div className="flex space-x-2">
                  <a href={previewUrl} download="return_invoice.pdf" className="text-gray-500 hover:text-gray-700" title="Download PDF">Download</a>
                  <button onClick={() => { window.URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} className="text-gray-500 hover:text-gray-700" title="Close">Close</button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">Reason: {formData.reason}</p>
              <iframe src={previewUrl} className="flex-1 w-full h-full border" />
            </div>
          </div>
        )}
        </div>
    );
};

export default ReturnInvoices;
