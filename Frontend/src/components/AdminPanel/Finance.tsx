import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, X, Trash2, Mail, RotateCcw, RefreshCw, Download, DownloadCloud } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { toast } from "react-toastify";
import { formatDate } from "../../utils/dateUtils";

interface Client {
    _id: string;
    companyName: string;
    address?: string;
    state?: string;
    companyInfo?: string;
    agreementPercentage?: number;
    payoutOption?: 'Agreement Percentage' | 'Flat Pay' | 'Both';
    flatPayAmount?: number;
    gstNumber?: string;
    billingDetails?: {
        _id?: string;
        address: string;
        state: string;
        gstNumber: string;
    }[];
    pocs?: { name: string; email: string; phone?: string }[];
}

interface Candidate {
    _id: string;
    jobId?: {
        _id: string;
        title: string;
    };
    dynamicFields: {
        Name?: string;
        candidateName?: string;
        [key: string]: any;
    };
    joiningDate?: string;
    status?: string;
}

interface InvoiceCandidate {
    candidateId: Candidate;
    designation: string;
    doj: string;
    ctc: number;
    amount: number;
}

interface Invoice {
    _id: string;
    client: Client;
    candidates: InvoiceCandidate[];
    agreementPercentage: number;
    payoutOption?: 'Agreement Percentage' | 'Flat Pay' | 'Both';
    flatPayAmount?: number;
    gstNumber?: string;
    igst?: number;
    cgst?: number;
    sgst?: number;
    status: string;
    createdAt: string;
    invoiceNumber?: string;
    invoiceDate?: string;
}

interface Payment {
    _id: string;
    invoiceId: Invoice;
    clientId: Client;
    candidateId: Candidate;
    amountReceived: number;
    receivedDate: string;
    recordedBy: {
        _id: string;
        name: string;
    };
}

// Searchable Select Component
const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder,
    className = ""
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500"
            >
                <span className={selectedOption ? "text-slate-800" : "text-slate-400"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <Plus className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-[100] mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search..."
                            className="w-full p-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`p-2 hover:bg-blue-50 cursor-pointer text-sm ${value === opt.value ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-700'}`}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-400 text-sm">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Finance = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
    const [customEmails, setCustomEmails] = useState<string>("");
    const [emailCc, setEmailCc] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);

    const [invoiceFormData, setInvoiceFormData] = useState({
        client: "",
        invoiceNumber: "",
        invoiceDate: new Date().toISOString().split('T')[0],
        agreementPercentage: "",
        payoutOption: "Agreement Percentage" as "Agreement Percentage" | "Flat Pay" | "Both",
        flatPayAmount: "",
        gstNumber: "",
        billingAddress: "",
        billingState: "",
        candidates: [
            { candidateId: "", designation: "", doj: "", ctc: "", amount: "" }
        ]
    });

    // Filter states for Invoices
    const [filterInvoiceClient, setFilterInvoiceClient] = useState('');
    const [filterInvoiceCandidate, setFilterInvoiceCandidate] = useState('');
    const [filterInvoiceStatus, setFilterInvoiceStatus] = useState('');
    const [filterInvoiceStartDate, setFilterInvoiceStartDate] = useState('');
    const [filterInvoiceEndDate, setFilterInvoiceEndDate] = useState('');

    // Filter states for Payments
    const [filterPaymentClient, setFilterPaymentClient] = useState('');
    const [filterPaymentCandidate, setFilterPaymentCandidate] = useState('');
    const [filterPaymentStartDate, setFilterPaymentStartDate] = useState('');
    const [filterPaymentEndDate, setFilterPaymentEndDate] = useState('');

    // Filter states for Expenses
    const [filterExpenseCategory, setFilterExpenseCategory] = useState('');
    const [filterExpenseStartDate, setFilterExpenseStartDate] = useState('');
    const [filterExpenseEndDate, setFilterExpenseEndDate] = useState('');


    const [paymentData, setPaymentData] = useState({
        amountReceived: "",
        receivedDate: "",
    });

    const [expenseData, setExpenseData] = useState({
        title: "",
        amount: "",
        category: "Other",
        date: new Date().toISOString().split('T')[0],
        description: "",
    });

    const [summaryData, setSummaryData] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0
    });
    const [summaryFilter, setSummaryFilter] = useState('monthly');

    useEffect(() => {
        fetchInvoices();
        fetchClients();
        fetchCandidates();
        fetchPayments();
        fetchExpenses();
        fetchSummary();
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [summaryFilter]);

    // Refetch data when filters change
    useEffect(() => {
        if (activeTab === 'invoices') {
            fetchInvoices();
        } else if (activeTab === 'payments') {
            fetchPayments();
        } else if (activeTab === 'expenses') {
            fetchExpenses();
        }
    }, [
        activeTab,
        filterInvoiceClient, filterInvoiceCandidate, filterInvoiceStatus, filterInvoiceStartDate, filterInvoiceEndDate,
        filterPaymentClient, filterPaymentCandidate, filterPaymentStartDate, filterPaymentEndDate,
        filterExpenseCategory, filterExpenseStartDate, filterExpenseEndDate
    ]);

    const fetchSummary = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/summary`, {
                params: { filter: summaryFilter }
            });
            setSummaryData(response.data);
        } catch (error) {
            console.error("Error fetching summary:", error);
        }
    };

    const fetchExpenses = async () => {
        try {
            const params = {
                category: filterExpenseCategory,
                startDate: filterExpenseStartDate,
                endDate: filterExpenseEndDate,
            };
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/expenses/all`, { params });
            setExpenses(response.data);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    };

    const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setExpenseData({ ...expenseData, [e.target.name]: e.target.value });
    };

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/expenses/create`, {
                ...expenseData,
                createdBy: user?._id,
            });
            toast.success("Expense added successfully");
            setIsExpenseModalOpen(false);
            setExpenseData({
                title: "",
                amount: "",
                category: "Other",
                date: new Date().toISOString().split('T')[0],
                description: "",
            });
            fetchExpenses();
        } catch (error) {
            console.error("Error adding expense:", error);
            toast.error("Failed to add expense");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/expenses/${id}`);
            toast.success("Expense deleted successfully");
            fetchExpenses();
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error("Failed to delete expense");
        }
    };

    const fetchInvoices = async () => {
        try {
            const params = {
                client: filterInvoiceClient,
                candidate: filterInvoiceCandidate,
                status: filterInvoiceStatus,
                startDate: filterInvoiceStartDate,
                endDate: filterInvoiceEndDate,
            };
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/all`, { params });
            setInvoices(response.data);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        }
    };

    const fetchPayments = async () => {
        try {
            const params = {
                client: filterPaymentClient,
                candidate: filterPaymentCandidate,
                startDate: filterPaymentStartDate,
                endDate: filterPaymentEndDate,
            };
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/payments`, { params });
            setPayments(response.data);
        } catch (error) {
            console.error("Error fetching payments:", error);
        }
    };

    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/clients`);
            if (response.data.success) {
                setClients(response.data.clients);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/CandidatesJob`);
            if (response.data.success) {
                setCandidates(response.data.candidates);
            }
        } catch (error) {
            console.error("Error fetching candidates:", error);
        } finally {
            setLoading(false);
        }
    };


    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
    };

    const handleInvoiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/create`, {
                ...invoiceFormData,
                createdBy: user?._id,
            });
            toast.success("Invoice created successfully");
            setIsCreatingInvoice(false);
            setInvoiceFormData({
                client: "",
                invoiceNumber: "",
                invoiceDate: new Date().toISOString().split('T')[0],
                agreementPercentage: "",
                payoutOption: "Agreement Percentage",
                flatPayAmount: "",
                gstNumber: "",
                billingAddress: "",
                billingState: "",
                candidates: [{ candidateId: "", designation: "", doj: "", ctc: "", amount: "" }]
            });
            fetchInvoices();
        } catch (error) {
            console.error("Error creating invoice:", error);
            toast.error("Failed to create invoice");
        } finally {
            setLoading(false);
        }
    };

    const addCandidateRow = () => {
        setInvoiceFormData({
            ...invoiceFormData,
            candidates: [...invoiceFormData.candidates, { candidateId: "", designation: "", doj: "", ctc: "", amount: "" }]
        });
    };

    const removeCandidateRow = (index: number) => {
        const newCandidates = invoiceFormData.candidates.filter((_, i) => i !== index);
        setInvoiceFormData({ ...invoiceFormData, candidates: newCandidates });
    };

    const calculateAmount = (ctc: any, percentage: any, flatAmount: any, option: string) => {
        const c = parseFloat(ctc) || 0;
        const p = parseFloat(percentage) || 0;
        const f = parseFloat(flatAmount) || 0;

        let amount = 0;
        if (option === 'Agreement Percentage') {
            amount = (c * p) / 100;
        } else if (option === 'Flat Pay') {
            amount = f;
        } else if (option === 'Both') {
            amount = ((c * p) / 100) + f;
        }
        return Math.round(amount);
    };

    const handleCandidateChange = (index: number, field: string, value: string) => {
        const newCandidates = [...invoiceFormData.candidates];
        (newCandidates[index] as any)[field] = value;

        // Auto-fill details if candidate is selected
        if (field === 'candidateId') {
            const selectedCandidate = candidates.find(c => c._id === value);
            if (selectedCandidate) {
                newCandidates[index].designation = selectedCandidate.jobId?.title || "";
                // Auto-fill Joining Date (DOJ)
                if (selectedCandidate.joiningDate) {
                    newCandidates[index].doj = selectedCandidate.joiningDate.split('T')[0];
                }

                // Auto-fill CTC from dynamicFields
                const df = (selectedCandidate as any).dynamicFields || {};
                const ctcKeys = ["Agreed CTC", "Offered CTC", "Final CTC", "Fixed CTC", "CTC", "expectedCTC", "currentCTC"];
                let foundCTC = "";
                for (const key of ctcKeys) {
                    if (df[key]) {
                        foundCTC = df[key].toString();
                        break;
                    }
                }

                if (!foundCTC) {
                    const anyCTCKey = Object.keys(df).find(k => k.toLowerCase().includes('ctc'));
                    if (anyCTCKey) foundCTC = df[anyCTCKey].toString();
                }

                if (foundCTC) {
                    newCandidates[index].ctc = foundCTC;
                }
            }
        }

        // Auto-calculate amount if CTC or candidate changes 
        if (field === 'ctc' || field === 'candidateId') {
            newCandidates[index].amount = calculateAmount(
                newCandidates[index].ctc,
                invoiceFormData.agreementPercentage,
                invoiceFormData.flatPayAmount,
                invoiceFormData.payoutOption
            ).toString();
        }

        setInvoiceFormData({ ...invoiceFormData, candidates: newCandidates });
    };

    const numberToWords = (num: number) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (parseInt(n[1]) !== 0) ? (a[Number(n[1])] || b[parseInt(n[1][0])] + ' ' + a[parseInt(n[1][1])]) + 'Crore ' : '';
        str += (parseInt(n[2]) !== 0) ? (a[Number(n[2])] || b[parseInt(n[2][0])] + ' ' + a[parseInt(n[2][1])]) + 'Lakh ' : '';
        str += (parseInt(n[3]) !== 0) ? (a[Number(n[3])] || b[parseInt(n[3][0])] + ' ' + a[parseInt(n[3][1])]) + 'Thousand ' : '';
        str += (parseInt(n[4]) !== 0) ? (a[Number(n[4])] || b[parseInt(n[4][0])] + ' ' + a[parseInt(n[4][1])]) + 'Hundred ' : '';
        str += (parseInt(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[parseInt(n[5][0])] + ' ' + a[parseInt(n[5][1])]) + 'Only' : '';
        return str || 'Zero Only';
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        if (!user?._id) {
            toast.error("User not authenticated");
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/mark-paid`, {
                invoiceId: selectedInvoice._id,
                amountReceived: parseFloat(paymentData.amountReceived),
                receivedDate: paymentData.receivedDate,
                recordedBy: user._id,
            });
            toast.success("Invoice marked as paid");
            setIsPaymentModalOpen(false);
            setPaymentData({ amountReceived: "", receivedDate: "" });
            setSelectedInvoice(null);
            fetchInvoices();
            fetchPayments();
        } catch (error) {
            console.error("Error marking invoice as paid:", error);
            toast.error("Failed to update invoice status");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInvoice = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/${id}`);
            toast.success("Invoice deleted successfully");
            fetchInvoices();
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error("Failed to delete invoice");
        }
    };

    const handleSendEmail = async (id: string) => {
        const invoice = invoices.find(inv => inv._id === id);
        if (!invoice) return;

        if (!user?.email || !user?.appPassword) {
            toast.error("Please update your profile with Email and App Password to send invoices.");
            return;
        }

        setSelectedInvoice(invoice);
        const pocEmails = invoice.client?.pocs?.map(p => p.email).filter(Boolean) as string[] || [];
        setEmailRecipients(pocEmails.length > 0 ? [pocEmails[0]] : []);
        setCustomEmails("");
        setEmailCc("");
        setIsEmailModalOpen(true);
    };

    const confirmSendEmail = async () => {
        if (!selectedInvoice) return;

        const allRecipients = [
            ...emailRecipients,
            ...customEmails.split(',').map(e => e.trim()).filter(Boolean)
        ].join(', ');

        if (!allRecipients) {
            toast.error("Please provide at least one recipient email.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/send-email`, {
                invoiceId: selectedInvoice._id,
                senderEmail: user?.email,
                senderPassword: user?.appPassword,
                recipients: allRecipients,
                cc: emailCc
            });
            toast.success("Invoice email sent successfully!");
            setIsEmailModalOpen(false);
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send email");
        } finally {
            setLoading(false);
        }
    };

    const handleResetStatus = async (id: string) => {
        if (!window.confirm("Are you sure you want to reset this invoice to Pending? This will delete the payment record.")) return;
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/reset-status`, { invoiceId: id });
            toast.success("Invoice status reset to Pending");
            fetchInvoices();
            fetchPayments();
        } catch (error) {
            console.error("Error resetting invoice status:", error);
            toast.error("Failed to reset invoice status");
        }
    };

    const openPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        const totalAmount = invoice.candidates?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
        setPaymentData({ amountReceived: totalAmount.toString(), receivedDate: new Date().toISOString().split('T')[0] });
        setIsPaymentModalOpen(true);
    };

    const calculateTimeLeft = (createdAt: string) => {
        const createdDate = new Date(createdAt);
        const dueDate = new Date(createdDate);
        dueDate.setDate(createdDate.getDate() + 30);

        const now = new Date();
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `Overdue by ${Math.abs(diffDays)} days`, color: "text-red-600 font-bold" };
        } else if (diffDays === 0) {
            return { text: "Due Today", color: "text-orange-600 font-bold" };
        } else {
            return { text: `${diffDays} days left`, color: "text-green-600" };
        }
    };

    const handleDownloadInvoice = async (id: string, invoiceNumber: string) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/download/${id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${invoiceNumber || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading invoice:", error);
            toast.error("Failed to download invoice");
        }
    };

    const handleDownloadPreview = async () => {
        try {
            const selectedClient = clients.find(c => c._id === invoiceFormData.client);

            // Prepare data for PDF generation
            const previewData = {
                ...invoiceFormData,
                client: {
                    ...selectedClient,
                    companyName: selectedClient?.companyName || "[Client Name]"
                },
                candidates: invoiceFormData.candidates.map(c => {
                    const cand = candidates.find(cand => cand._id === c.candidateId);
                    return {
                        ...c,
                        candidateId: {
                            ...cand,
                            dynamicFields: cand?.dynamicFields || {}
                        },
                        amount: parseFloat(c.amount) || 0
                    };
                }),
                invoiceDate: invoiceFormData.invoiceDate || new Date().toISOString()
            };

            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/preview-download`, previewData, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_Preview.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading preview:", error);
            toast.error("Failed to download preview");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Finance Dashboard</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Summary:</span>
                    <select
                        value={summaryFilter}
                        onChange={(e) => setSummaryFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                        <option value="weekly">This Week</option>
                        <option value="monthly">This Month</option>
                        <option value="yearly">This Year</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            {/* Profit & Loss Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">₹{summaryData.totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">₹{summaryData.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Net Profit</p>
                    <p className={`text-2xl font-bold ${summaryData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₹{summaryData.netProfit.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Profit Margin</p>
                    <p className={`text-2xl font-bold ${summaryData.profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        {summaryData.profitMargin}%
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4">
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'invoices' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Invoices
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'payments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Payment History
                        </button>
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Daily Expenses
                        </button>
                    </div>
                    {activeTab === 'expenses' ? (
                        <button
                            onClick={() => setIsExpenseModalOpen(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
                        >
                            <Plus size={20} />
                            Add Expense
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsCreatingInvoice(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={20} />
                            Create Invoice
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'invoices' && (
                <>
                    <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                        <h3 className="text-lg font-semibold text-gray-700 mr-2">Filters:</h3>
                        <SearchableSelect
                            options={clients.map(c => ({ value: c._id, label: c.companyName }))}
                            value={filterInvoiceClient}
                            onChange={(val) => setFilterInvoiceClient(val)}
                            placeholder="All Clients"
                            className="w-48"
                        />
                        <SearchableSelect
                            options={candidates.map(c => ({
                                value: c._id,
                                label: `${c.dynamicFields?.candidateName || c.dynamicFields?.Name || "Unknown"}`
                            }))}
                            value={filterInvoiceCandidate}
                            onChange={(val) => setFilterInvoiceCandidate(val)}
                            placeholder="All Candidates"
                            className="w-48"
                        />
                        <SearchableSelect
                            options={[
                                { value: "Pending", label: "Pending" },
                                { value: "Paid", label: "Paid" },
                                { value: "Overdue", label: "Overdue" }
                            ]}
                            value={filterInvoiceStatus}
                            onChange={(val) => setFilterInvoiceStatus(val)}
                            placeholder="All Statuses"
                            className="w-40"
                        />
                        <input
                            type="date"
                            value={filterInvoiceStartDate}
                            onChange={(e) => setFilterInvoiceStartDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                            title="Start Date"
                        />
                        <input
                            type="date"
                            value={filterInvoiceEndDate}
                            onChange={(e) => setFilterInvoiceEndDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                            title="End Date"
                        />
                        <button
                            onClick={() => {
                                setFilterInvoiceClient('');
                                setFilterInvoiceCandidate('');
                                setFilterInvoiceStatus('');
                                setFilterInvoiceStartDate('');
                                setFilterInvoiceEndDate('');
                            }}
                            className="ml-auto px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">Client</th>
                                    <th className="p-4 font-semibold text-gray-600">Candidate</th>
                                    <th className="p-4 font-semibold text-gray-600">Amount</th>
                                    <th className="p-4 font-semibold text-gray-600 truncate">Payout Terms</th>
                                    <th className="p-4 font-semibold text-gray-600">Status</th>
                                    <th className="p-4 font-semibold text-gray-600">Date</th>
                                    <th className="p-4 font-semibold text-gray-600">Time Left</th>
                                    <th className="p-4 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50">
                                        <td className="p-4">{invoice.client?.companyName || "N/A"}</td>
                                        <td className="p-4 font-medium text-gray-800">{invoice.invoiceNumber || "-"}</td>
                                        <td className="p-4">
                                            {invoice.candidates?.[0]?.candidateId?.dynamicFields?.candidateName ||
                                                invoice.candidates?.[0]?.candidateId?.dynamicFields?.Name ||
                                                "N/A"}
                                            {invoice.candidates?.length > 1 && ` (+${invoice.candidates.length - 1} more)`}
                                        </td>
                                        <td className="p-4">₹{(invoice.candidates?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0).toLocaleString()}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                {(invoice.payoutOption === 'Agreement Percentage' || invoice.payoutOption === 'Both' || !invoice.payoutOption) && (
                                                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                                        {invoice.agreementPercentage}%
                                                    </span>
                                                )}
                                                {(invoice.payoutOption === 'Flat Pay' || invoice.payoutOption === 'Both') && (
                                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                                                        ₹{Number(invoice.flatPayAmount).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${invoice.status === "Paid"
                                                    ? "bg-green-100 text-green-700"
                                                    : invoice.status === "Overdue"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                            >
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : formatDate(invoice.createdAt)}
                                        </td>
                                        <td className={`p-4 ${calculateTimeLeft(invoice.createdAt).color}`}>
                                            {calculateTimeLeft(invoice.createdAt).text}
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            {invoice.status !== "Paid" ? (
                                                <button
                                                    onClick={() => openPaymentModal(invoice)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Mark as Paid
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleResetStatus(invoice._id)}
                                                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                                    title="Reset to Pending"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDownloadInvoice(invoice._id, invoice.invoiceNumber || "")}
                                                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                                                title="Download PDF"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleSendEmail(invoice._id)}
                                                className="text-gray-600 hover:text-blue-600 text-sm font-medium"
                                                title="Send Email"
                                            >
                                                <Mail size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInvoice(invoice._id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                title="Delete Invoice"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500">
                                            No invoices found. Create one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'payments' && (
                <>
                    <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                        <h3 className="text-lg font-semibold text-gray-700 mr-2">Filters:</h3>
                        <SearchableSelect
                            options={clients.map(c => ({ value: c._id, label: c.companyName }))}
                            value={filterPaymentClient}
                            onChange={(val) => setFilterPaymentClient(val)}
                            placeholder="All Clients"
                            className="w-48"
                        />
                        <SearchableSelect
                            options={candidates.map(c => ({
                                value: c._id,
                                label: `${c.dynamicFields?.candidateName || c.dynamicFields?.Name || "Unknown"}`
                            }))}
                            value={filterPaymentCandidate}
                            onChange={(val) => setFilterPaymentCandidate(val)}
                            placeholder="All Candidates"
                            className="w-48"
                        />
                        <input
                            type="date"
                            value={filterPaymentStartDate}
                            onChange={(e) => setFilterPaymentStartDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                            title="Start Date"
                        />
                        <input
                            type="date"
                            value={filterPaymentEndDate}
                            onChange={(e) => setFilterPaymentEndDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                            title="End Date"
                        />
                        <button
                            onClick={() => {
                                setFilterPaymentClient('');
                                setFilterPaymentCandidate('');
                                setFilterPaymentStartDate('');
                                setFilterPaymentEndDate('');
                            }}
                            className="ml-auto px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">Client</th>
                                    <th className="p-4 font-semibold text-gray-600">Candidate</th>
                                    <th className="p-4 font-semibold text-gray-600">Amount Received</th>
                                    <th className="p-4 font-semibold text-gray-600">Received Date</th>
                                    <th className="p-4 font-semibold text-gray-600">Recorded By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-gray-50">
                                        <td className="p-4">{payment.clientId?.companyName || "N/A"}</td>
                                        <td className="p-4">
                                            {payment.candidateId?.dynamicFields?.candidateName ||
                                                payment.candidateId?.dynamicFields?.Name ||
                                                "N/A"}
                                        </td>
                                        <td className="p-4 text-green-600 font-medium">₹{payment.amountReceived}</td>
                                        <td className="p-4">
                                            {formatDate(payment.receivedDate)}
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {payment.recordedBy?.name || "Unknown"}
                                        </td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            No payment history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'expenses' && (
                <>
                    <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                        <h3 className="text-lg font-semibold text-gray-700 mr-2">Filters:</h3>
                        <select
                            value={filterExpenseCategory}
                            onChange={(e) => setFilterExpenseCategory(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">All Categories</option>
                            <option value="Food">Food</option>
                            <option value="Transport">Transport</option>
                            <option value="Office Supplies">Office Supplies</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Rent">Rent</option>
                            <option value="Salaries">Salaries</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Software">Software</option>
                            <option value="Other">Other</option>
                        </select>
                        <input
                            type="date"
                            value={filterExpenseStartDate}
                            onChange={(e) => setFilterExpenseStartDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                            title="Start Date"
                        />
                        <input
                            type="date"
                            value={filterExpenseEndDate}
                            onChange={(e) => setFilterExpenseEndDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                            title="End Date"
                        />
                        <button
                            onClick={() => {
                                setFilterExpenseCategory('');
                                setFilterExpenseStartDate('');
                                setFilterExpenseEndDate('');
                            }}
                            className="ml-auto px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">Title</th>
                                    <th className="p-4 font-semibold text-gray-600">Category</th>
                                    <th className="p-4 font-semibold text-gray-600">Amount</th>
                                    <th className="p-4 font-semibold text-gray-600">Date</th>
                                    <th className="p-4 font-semibold text-gray-600">Description</th>
                                    <th className="p-4 font-semibold text-gray-600">Recorded By</th>
                                    <th className="p-4 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">{expense.title}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-red-600 font-medium">₹{expense.amount}</td>
                                        <td className="p-4">{formatDate(expense.date)}</td>
                                        <td className="p-4 text-gray-500 text-sm max-w-xs truncate">{expense.description || "-"}</td>
                                        <td className="p-4 text-gray-500 text-sm">{expense.createdBy?.name || "Unknown"}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleDeleteExpense(expense._id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                title="Delete Expense"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">
                                            No expenses recorded.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {isCreatingInvoice && (
                <div className="fixed inset-0 bg-slate-50 z-[60] overflow-y-auto">
                    <div className="max-w-[1400px] mx-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsCreatingInvoice(false)}
                                    className="p-2 hover:bg-white rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                                <h2 className="text-2xl font-bold text-slate-800">Create Multi-Candidate Invoice</h2>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCreatingInvoice(false)}
                                    className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInvoiceSubmit}
                                    disabled={loading || !invoiceFormData.client || invoiceFormData.candidates.some(c => !c.candidateId || !c.amount)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center gap-2"
                                >
                                    {loading ? "Creating..." : "Save & Generate Invoice"}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Left Side: Form */}
                            <div className="w-full md:w-1/2 space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-4">Client Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Client</label>
                                            <div className="flex items-center gap-2">
                                                <SearchableSelect
                                                    options={clients.map(c => ({ value: c._id, label: c.companyName }))}
                                                    value={invoiceFormData.client}
                                                    placeholder="Select Client"
                                                    className="flex-1"
                                                    onChange={(clientId) => {
                                                        const selectedClient = clients.find(c => c._id === clientId);
                                                        const defaultBilling = selectedClient?.billingDetails?.[0];
                                                        const percentage = selectedClient?.agreementPercentage?.toString() || "";
                                                        const option = selectedClient?.payoutOption || "Agreement Percentage";
                                                        const flat = selectedClient?.flatPayAmount?.toString() || "";

                                                        // Recalculate all candidate amounts with new client's payout info
                                                        const updatedCandidates = invoiceFormData.candidates.map(cand => ({
                                                            ...cand,
                                                            amount: calculateAmount(cand.ctc, percentage, flat, option).toString()
                                                        }));

                                                        setInvoiceFormData({
                                                            ...invoiceFormData,
                                                            client: clientId,
                                                            agreementPercentage: percentage,
                                                            payoutOption: option,
                                                            flatPayAmount: flat,
                                                            gstNumber: defaultBilling?.gstNumber || selectedClient?.gstNumber || "",
                                                            billingAddress: defaultBilling?.address || selectedClient?.address || "",
                                                            billingState: defaultBilling?.state || selectedClient?.state || "",
                                                            candidates: updatedCandidates
                                                        });
                                                    }}
                                                />
                                                <a
                                                    href="/Admin/clients/add"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition shadow-sm"
                                                    title="Add New Client"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={fetchClients}
                                                    className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition shadow-sm"
                                                    title="Refresh Clients list"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                        {invoiceFormData.client && (() => {
                                            const selectedClient = clients.find(c => c._id === invoiceFormData.client);
                                            return selectedClient?.billingDetails && selectedClient.billingDetails.length > 0 && (
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Billing Location</label>
                                                    <SearchableSelect
                                                        options={selectedClient.billingDetails.map((detail, idx) => ({
                                                            value: idx.toString(),
                                                            label: `${detail.address} (${detail.state})`
                                                        }))}
                                                        value={invoiceFormData.billingAddress ? (selectedClient.billingDetails.findIndex(d => d.address === invoiceFormData.billingAddress).toString()) : ""}
                                                        placeholder="Select Billing Location"
                                                        className="w-full"
                                                        onChange={(idxStr) => {
                                                            const idx = parseInt(idxStr);
                                                            const detail = selectedClient.billingDetails![idx];
                                                            if (detail) {
                                                                setInvoiceFormData({
                                                                    ...invoiceFormData,
                                                                    gstNumber: detail.gstNumber || "",
                                                                    billingAddress: detail.address || "",
                                                                    billingState: detail.state || ""
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })()}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Address</label>
                                            <textarea
                                                value={invoiceFormData.billingAddress}
                                                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, billingAddress: e.target.value })}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Billing Address for this invoice"
                                                rows={2}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing State</label>
                                            <SearchableSelect
                                                options={[
                                                    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
                                                    { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
                                                    { value: "Assam", label: "Assam" },
                                                    { value: "Bihar", label: "Bihar" },
                                                    { value: "Chhattisgarh", label: "Chhattisgarh" },
                                                    { value: "Goa", label: "Goa" },
                                                    { value: "Gujarat", label: "Gujarat" },
                                                    { value: "Haryana", label: "Haryana" },
                                                    { value: "Himachal Pradesh", label: "Himachal Pradesh" },
                                                    { value: "Jharkhand", label: "Jharkhand" },
                                                    { value: "Karnataka", label: "Karnataka" },
                                                    { value: "Kerala", label: "Kerala" },
                                                    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
                                                    { value: "Maharashtra", label: "Maharashtra" },
                                                    { value: "Manipur", label: "Manipur" },
                                                    { value: "Meghalaya", label: "Meghalaya" },
                                                    { value: "Mizoram", label: "Mizoram" },
                                                    { value: "Nagaland", label: "Nagaland" },
                                                    { value: "Odisha", label: "Odisha" },
                                                    { value: "Punjab", label: "Punjab" },
                                                    { value: "Rajasthan", label: "Rajasthan" },
                                                    { value: "Sikkim", label: "Sikkim" },
                                                    { value: "Tamil Nadu", label: "Tamil Nadu" },
                                                    { value: "Telangana", label: "Telangana" },
                                                    { value: "Tripura", label: "Tripura" },
                                                    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
                                                    { value: "Uttarakhand", label: "Uttarakhand" },
                                                    { value: "West Bengal", label: "West Bengal" },
                                                    { value: "Andaman and Nicobar Islands", label: "Andaman and Nicobar Islands" },
                                                    { value: "Chandigarh", label: "Chandigarh" },
                                                    { value: "Dadra and Nagar Haveli and Daman and Diu", label: "Dadra and Nagar Haveli and Daman and Diu" },
                                                    { value: "Delhi", label: "Delhi" },
                                                    { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
                                                    { value: "Ladakh", label: "Ladakh" },
                                                    { value: "Lakshadweep", label: "Lakshadweep" },
                                                    { value: "Puducherry", label: "Puducherry" }
                                                ]}
                                                value={invoiceFormData.billingState}
                                                placeholder="Select State"
                                                className="w-full"
                                                onChange={(val) => setInvoiceFormData({ ...invoiceFormData, billingState: val })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payout Method</label>
                                            <select
                                                value={invoiceFormData.payoutOption}
                                                onChange={(e) => {
                                                    const newOption = e.target.value as any;
                                                    const newPercentage = (newOption === 'Flat Pay') ? "" : invoiceFormData.agreementPercentage;
                                                    const newFlat = (newOption === 'Agreement Percentage') ? "" : invoiceFormData.flatPayAmount;

                                                    const updatedCandidates = invoiceFormData.candidates.map(cand => ({
                                                        ...cand,
                                                        amount: calculateAmount(cand.ctc, newPercentage, newFlat, newOption).toString()
                                                    }));

                                                    setInvoiceFormData({
                                                        ...invoiceFormData,
                                                        payoutOption: newOption,
                                                        agreementPercentage: newPercentage,
                                                        flatPayAmount: newFlat,
                                                        candidates: updatedCandidates
                                                    });
                                                }}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="Agreement Percentage">Agreement Percentage</option>
                                                <option value="Flat Pay">Flat Pay</option>
                                                <option value="Both">Both</option>
                                            </select>
                                        </div>
                                        {(invoiceFormData.payoutOption === 'Agreement Percentage' || invoiceFormData.payoutOption === 'Both') && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Agreement %</label>
                                                <input
                                                    type="number"
                                                    value={invoiceFormData.agreementPercentage}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const updatedCandidates = invoiceFormData.candidates.map(cand => ({
                                                            ...cand,
                                                            amount: calculateAmount(cand.ctc, val, invoiceFormData.flatPayAmount, invoiceFormData.payoutOption).toString()
                                                        }));
                                                        setInvoiceFormData({
                                                            ...invoiceFormData,
                                                            agreementPercentage: val,
                                                            candidates: updatedCandidates
                                                        });
                                                    }}
                                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g. 8.33"
                                                />
                                            </div>
                                        )}
                                        {(invoiceFormData.payoutOption === 'Flat Pay' || invoiceFormData.payoutOption === 'Both') && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Flat Pay Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    value={invoiceFormData.flatPayAmount}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const updatedCandidates = invoiceFormData.candidates.map(cand => ({
                                                            ...cand,
                                                            amount: calculateAmount(cand.ctc, invoiceFormData.agreementPercentage, val, invoiceFormData.payoutOption).toString()
                                                        }));
                                                        setInvoiceFormData({
                                                            ...invoiceFormData,
                                                            flatPayAmount: val,
                                                            candidates: updatedCandidates
                                                        });
                                                    }}
                                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g. 50000"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invoice Number</label>
                                            <input
                                                type="text"
                                                value={invoiceFormData.invoiceNumber}
                                                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceNumber: e.target.value })}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g. JT/RO/25-26/001"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invoice Date</label>
                                            <input
                                                type="date"
                                                value={invoiceFormData.invoiceDate}
                                                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceDate: e.target.value })}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST Number</label>
                                            <input
                                                type="text"
                                                value={invoiceFormData.gstNumber}
                                                onChange={(e) => setInvoiceFormData({ ...invoiceFormData, gstNumber: e.target.value })}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Client GST Number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <h3 className="font-bold text-slate-800">Candidates List</h3>
                                        <button
                                            onClick={addCandidateRow}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1"
                                        >
                                            <Plus size={16} /> Add Candidate
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {invoiceFormData.candidates.map((row, index) => (
                                            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group">
                                                {invoiceFormData.candidates.length > 1 && (
                                                    <button
                                                        onClick={() => removeCandidateRow(index)}
                                                        className="absolute -top-2 -right-2 bg-white border border-red-200 text-red-500 p-1 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Candidate</label>
                                                        <div className="flex items-center gap-2">
                                                            <SearchableSelect
                                                                options={candidates
                                                                    .filter(c => c.status?.toLowerCase() === 'selected' || c.status?.toLowerCase() === 'joined')
                                                                    .map(c => ({
                                                                        value: c._id,
                                                                        label: `${c.dynamicFields?.candidateName || c.dynamicFields?.Name || "Unknown"} (${c.status})`
                                                                    }))}
                                                                value={row.candidateId}
                                                                placeholder="Select Candidate"
                                                                className="flex-1"
                                                                onChange={(val) => handleCandidateChange(index, 'candidateId', val)}
                                                            />
                                                            <a
                                                                href="/Admin/candidates/add"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition shadow-sm"
                                                                title="Add New Candidate"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={fetchCandidates}
                                                                className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition shadow-sm"
                                                                title="Refresh Candidates list"
                                                            >
                                                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Designation</label>
                                                        <input
                                                            type="text"
                                                            value={row.designation}
                                                            onChange={(e) => handleCandidateChange(index, 'designation', e.target.value)}
                                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g. Software Engineer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">D.O.J</label>
                                                        <input
                                                            type="date"
                                                            value={row.doj}
                                                            onChange={(e) => handleCandidateChange(index, 'doj', e.target.value)}
                                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CTC (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={row.ctc}
                                                            onChange={(e) => handleCandidateChange(index, 'ctc', e.target.value)}
                                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g. 1200000"
                                                        />
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-100">
                                                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Invoice Amount (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={row.amount}
                                                            onChange={(e) => handleCandidateChange(index, 'amount', e.target.value)}
                                                            className="w-full p-2 border-2 border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50"
                                                            placeholder="e.g. 100000"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Preview */}
                            <div className="w-full md:w-1/2 sticky top-6">
                                <div className="bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden min-h-[800px] flex flex-col">
                                    <div className="bg-slate-800 p-3 text-white flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span>Live Invoice Preview</span>
                                        <button
                                            onClick={handleDownloadPreview}
                                            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                                            title="Download Preview PDF"
                                        >
                                            <DownloadCloud size={14} />
                                            Download
                                        </button>
                                    </div>
                                    <div className="p-12 flex-1 flex flex-col text-[12px] leading-relaxed text-slate-800 font-serif">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-12">
                                            <div>
                                                <img src="/src/images/logo.png" alt="Logo" className="w-32 mb-2" />
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">Invoice No. {invoiceFormData.invoiceNumber || "JT/RO/25-26/XXXX"}</p>
                                                <p>Date: {new Date(invoiceFormData.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                        </div>

                                        {/* To Address */}
                                        <div className="mb-8">
                                            <p className="mb-1">To,</p>
                                            <p className="font-bold text-lg mb-1">{clients.find(c => c._id === invoiceFormData.client)?.companyName || "[Client Name]"}</p>
                                            <p className="text-slate-600 w-2/3">
                                                {(() => {
                                                    const addressParts = [];
                                                    if (invoiceFormData.billingAddress) addressParts.push(invoiceFormData.billingAddress);
                                                    if (invoiceFormData.billingState) addressParts.push(invoiceFormData.billingState);

                                                    if (addressParts.length > 0) return addressParts.join(', ');

                                                    const selectedClient = clients.find(c => c._id === invoiceFormData.client);
                                                    if (!selectedClient) return "Select a client to view address...";
                                                    return selectedClient.companyInfo || "No address available";
                                                })()}
                                            </p>
                                            <div className="mt-4 flex flex-col gap-1">
                                                <p className="font-bold">SAC Code: 998512</p>
                                                {(() => {
                                                    const selectedClient = clients.find(c => c._id === invoiceFormData.client);
                                                    const gst = invoiceFormData.gstNumber || selectedClient?.gstNumber;
                                                    return gst ? <p className="font-bold">GST No: {gst}</p> : null;
                                                })()}
                                            </div>
                                        </div>

                                        {/* Table */}
                                        <table className="w-full mb-8 border-collapse">
                                            <thead>
                                                <tr className="border-y-2 border-slate-800 font-bold">
                                                    <td className="py-2 px-1">Sr. No.</td>
                                                    <td className="py-2 px-1">Name Of the Candidate</td>
                                                    <td className="py-2 px-1">D.O.J</td>
                                                    <td className="py-2 px-1">Designation</td>
                                                    <td className="py-2 px-1">CTC</td>
                                                    <td className="py-2 px-1 text-right">Amount</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoiceFormData.candidates.map((c, i) => {
                                                    const cand = candidates.find(cand => cand._id === c.candidateId);
                                                    return (
                                                        <tr key={i} className="border-b border-slate-200">
                                                            <td className="py-3 px-1">{i + 1}</td>
                                                            <td className="py-3 px-1 font-bold">{cand?.dynamicFields?.candidateName || cand?.dynamicFields?.Name || "[Candidate Name]"}</td>
                                                            <td className="py-3 px-1">{c.doj ? new Date(c.doj).toLocaleDateString('en-GB') : "-"}</td>
                                                            <td className="py-3 px-1">{c.designation || cand?.jobId?.title || "-"}</td>
                                                            <td className="py-3 px-1">{c.ctc ? `₹${Number(c.ctc).toLocaleString()}` : "-"}</td>
                                                            <td className="py-3 px-1 text-right font-bold">₹{Number(c.amount || 0).toLocaleString()}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Totals Section */}
                                        <div className="flex justify-end mb-8">
                                            <div className="w-1/2 space-y-2 border-t-2 border-slate-800 pt-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-semibold">Sub Total</span>
                                                    <span>₹{invoiceFormData.candidates.reduce((sum, c) => sum + Number(c.amount || 0), 0).toLocaleString()}</span>
                                                </div>
                                                {(() => {
                                                    const isKarnataka = invoiceFormData.billingState?.toLowerCase() === 'karnataka';
                                                    const total = invoiceFormData.candidates.reduce((sum, c) => sum + Number(c.amount || 0), 0);
                                                    const tax = Math.round(total * 0.18);

                                                    if (isKarnataka) {
                                                        const halfTax = Math.round(total * 0.09);
                                                        return (
                                                            <>
                                                                <div className="flex justify-between text-sm text-slate-600 italic">
                                                                    <span>CGST @9%</span>
                                                                    <span>₹{halfTax.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm text-slate-600 italic">
                                                                    <span>SGST @9%</span>
                                                                    <span>₹{halfTax.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2">
                                                                    <span>Grand Total</span>
                                                                    <span>₹{(total + (halfTax * 2)).toLocaleString()}</span>
                                                                </div>
                                                            </>
                                                        );
                                                    }
                                                    return (
                                                        <>
                                                            <div className="flex justify-between text-sm text-slate-600 italic">
                                                                <span>IGST @18%</span>
                                                                <span>₹{tax.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2">
                                                                <span>Grand Total</span>
                                                                <span>₹{(total + tax).toLocaleString()}</span>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <p className="mb-12 italic">
                                            Amount in words -- {(() => {
                                                const total = invoiceFormData.candidates.reduce((sum, c) => sum + Number(c.amount || 0), 0);
                                                const grandTotal = Math.round(total * 1.18);
                                                return numberToWords(grandTotal);
                                            })()}
                                        </p>

                                        {/* Bank Details & Signature Section */}
                                        <div className="mt-auto pt-8 border-t border-slate-100">
                                            <div className="flex justify-between items-start gap-8 mb-8">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800 mb-2">Bank Details:</p>
                                                    <div className="text-xs space-y-1 text-slate-600">
                                                        <p><span className="font-semibold text-slate-800">Name:</span> Jobs Territory</p>
                                                        <p><span className="font-semibold text-slate-800">Bank Name:</span> HDFC Bank</p>
                                                        <p><span className="font-semibold text-slate-800">Account Number:</span> 59207259123253</p>
                                                        <p><span className="font-semibold text-slate-800">Branch Name:</span> Cambridge Road</p>
                                                        <p><span className="font-semibold text-slate-800">IFSC Code:</span> HDFC0001298</p>
                                                    </div>
                                                    <div className="mt-4 text-xs space-y-1 text-slate-600">
                                                        <p><span className="font-semibold text-slate-800">PAN:</span> AOBPR6552H</p>
                                                        <p><span className="font-semibold text-slate-800">GST No:</span> 29AOBPR6552H1ZL</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <p className="font-bold text-slate-800 mb-16 text-xs uppercase tracking-wider">For Jobs Territory</p>
                                                    <div className="w-48 border-t-2 border-slate-800 mb-2"></div>
                                                    <p className="font-bold text-xs text-slate-800 uppercase">Authorised Signatory</p>
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-600 text-center border-t border-slate-100 pt-4">
                                                <p className="font-bold text-slate-800">Jobs Territory</p>
                                                <p>Lines 1 & 2, 1st Floor, RPC Layout, Vijayanagar, Bangalore - 560040</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold mb-6">Mark as Paid</h2>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount Received (₹)
                                </label>
                                <input
                                    type="number"
                                    name="amountReceived"
                                    value={paymentData.amountReceived}
                                    onChange={handlePaymentChange}
                                    required
                                    min="0"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Received Date
                                </label>
                                <input
                                    type="date"
                                    name="receivedDate"
                                    value={paymentData.receivedDate}
                                    onChange={handlePaymentChange}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                            >
                                {loading ? "Processing..." : "Confirm Payment"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isExpenseModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsExpenseModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold mb-6">Add Daily Expense</h2>
                        <form onSubmit={handleExpenseSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={expenseData.title}
                                    onChange={handleExpenseChange}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. Office Lunch"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <SearchableSelect
                                    options={[
                                        { value: "Food", label: "Food" },
                                        { value: "Transport", label: "Transport" },
                                        { value: "Office Supplies", label: "Office Supplies" },
                                        { value: "Utilities", label: "Utilities" },
                                        { value: "Rent", label: "Rent" },
                                        { value: "Salaries", label: "Salaries" },
                                        { value: "Marketing", label: "Marketing" },
                                        { value: "Software", label: "Software" },
                                        { value: "Other", label: "Other" }
                                    ]}
                                    value={expenseData.category}
                                    placeholder="Select Category"
                                    className="w-full"
                                    onChange={(val) => setExpenseData({ ...expenseData, category: val })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={expenseData.amount}
                                    onChange={handleExpenseChange}
                                    required
                                    min="0"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={expenseData.date}
                                    onChange={handleExpenseChange}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={expenseData.description}
                                    onChange={handleExpenseChange}
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Optional details..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
                            >
                                {loading ? "Adding..." : "Add Expense"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {isEmailModalOpen && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                        <button
                            onClick={() => setIsEmailModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold mb-2">Send Invoice Email</h2>
                        <p className="text-sm text-gray-500 mb-6">Select recipients for <span className="font-semibold">{selectedInvoice.client?.companyName}</span></p>

                        <div className="space-y-6">
                            {/* POC Emails */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Client POC Emails</label>
                                <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                                    {selectedInvoice.client?.pocs?.length ? (
                                        selectedInvoice.client.pocs.map((poc, idx) => (
                                            <label key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={emailRecipients.includes(poc.email)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setEmailRecipients([...emailRecipients, poc.email]);
                                                        } else {
                                                            setEmailRecipients(emailRecipients.filter(email => email !== poc.email));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700">{poc.name}</span>
                                                    <span className="text-xs text-slate-500">{poc.email}</span>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No POC emails found for this client.</p>
                                    )}
                                </div>
                            </div>

                            {/* Custom Emails */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Custom Recipients (Optional)</label>
                                <input
                                    type="text"
                                    value={customEmails}
                                    onChange={(e) => setCustomEmails(e.target.value)}
                                    placeholder="e.g. finance@client.com, owner@client.com"
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 italic">Separate multiple emails with commas</p>
                            </div>

                            {/* CC Emails */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CC (Optional)</label>
                                <input
                                    type="text"
                                    value={emailCc}
                                    onChange={(e) => setEmailCc(e.target.value)}
                                    placeholder="e.g. manager@mycompany.com"
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsEmailModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSendEmail}
                                    disabled={loading || (emailRecipients.length === 0 && !customEmails.trim())}
                                    className="flex-[2] bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 font-bold text-sm shadow-md flex items-center justify-center gap-2"
                                >
                                    <Mail size={18} />
                                    {loading ? "Sending..." : "Send Invoice Email"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
