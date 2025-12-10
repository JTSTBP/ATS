import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, X, Trash2, Mail, RotateCcw } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { toast } from "react-toastify";

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

interface Invoice {
    _id: string;
    client: Client;
    candidate: Candidate;
    agreementPercentage: number;
    amount?: number;
    status: string;
    createdAt: string;
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

const Finance = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);

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

    const [formData, setFormData] = useState({
        client: "",
        candidate: "",
        agreementPercentage: "",
        amount: "",
    });

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/create`, {
                ...formData,
                createdBy: user?._id,
            });
            toast.success("Invoice created successfully");
            setIsModalOpen(false);
            setFormData({ client: "", candidate: "", agreementPercentage: "", amount: "" });
            fetchInvoices();
        } catch (error) {
            console.error("Error creating invoice:", error);
            toast.error("Failed to create invoice");
        } finally {
            setLoading(false);
        }
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
        if (!user?.email || !user?.appPassword) {
            toast.error("Please update your profile with Email and App Password to send invoices.");
            return;
        }
        if (!window.confirm("Are you sure you want to send the invoice email to the client?")) return;
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/invoices/send-email`, {
                invoiceId: id,
                senderEmail: user.email,
                senderPassword: user.appPassword
            });
            toast.success("Email sent successfully");
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send email");
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
        setPaymentData({ amountReceived: invoice.amount?.toString() || "", receivedDate: new Date().toISOString().split('T')[0] });
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
                            onClick={() => setIsModalOpen(true)}
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
                        <select
                            value={filterInvoiceClient}
                            onChange={(e) => setFilterInvoiceClient(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">All Clients</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>{client.companyName}</option>
                            ))}
                        </select>
                        <select
                            value={filterInvoiceCandidate}
                            onChange={(e) => setFilterInvoiceCandidate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">All Candidates</option>
                            {candidates.map(candidate => (
                                <option key={candidate._id} value={candidate._id}>
                                    {candidate.dynamicFields?.candidateName || candidate.dynamicFields?.Name || "Unknown"}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterInvoiceStatus}
                            onChange={(e) => setFilterInvoiceStatus(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                        </select>
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
                                    <th className="p-4 font-semibold text-gray-600">Agreement %</th>
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
                                        <td className="p-4">
                                            {invoice.candidate?.dynamicFields?.candidateName ||
                                                invoice.candidate?.dynamicFields?.Name ||
                                                "N/A"}
                                        </td>
                                        <td className="p-4">₹{invoice.amount || 0}</td>
                                        <td className="p-4">{invoice.agreementPercentage}%</td>
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
                                            {new Date(invoice.createdAt).toLocaleDateString()}
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
                        <select
                            value={filterPaymentClient}
                            onChange={(e) => setFilterPaymentClient(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">All Clients</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>{client.companyName}</option>
                            ))}
                        </select>
                        <select
                            value={filterPaymentCandidate}
                            onChange={(e) => setFilterPaymentCandidate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">All Candidates</option>
                            {candidates.map(candidate => (
                                <option key={candidate._id} value={candidate._id}>
                                    {candidate.dynamicFields?.candidateName || candidate.dynamicFields?.Name || "Unknown"}
                                </option>
                            ))}
                        </select>
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
                                            {new Date(payment.receivedDate).toLocaleDateString()}
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
                                        <td className="p-4">{new Date(expense.date).toLocaleDateString()}</td>
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold mb-6">Create New Invoice</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Client
                                </label>
                                <select
                                    name="client"
                                    value={formData.client}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Client</option>
                                    {clients.map((client) => (
                                        <option key={client._id} value={client._id}>
                                            {client.companyName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Candidate
                                </label>
                                <select
                                    name="candidate"
                                    value={formData.candidate}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Candidate</option>
                                    {candidates.map((candidate) => (
                                        <option key={candidate._id} value={candidate._id}>
                                            {candidate.dynamicFields?.candidateName ||
                                                candidate.dynamicFields?.Name ||
                                                "Unknown Candidate"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Agreement Percentage (%)
                                </label>
                                <input
                                    type="number"
                                    name="agreementPercentage"
                                    value={formData.agreementPercentage}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    max="100"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 10"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 5000"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                            >
                                {loading ? "Creating..." : "Create Invoice"}
                            </button>
                        </form>
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
                                <select
                                    name="category"
                                    value={expenseData.category}
                                    onChange={handleExpenseChange}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
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
        </div>
    );
};

export default Finance;
