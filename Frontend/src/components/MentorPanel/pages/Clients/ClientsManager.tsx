import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Globe, Linkedin, Phone, Mail, Pencil, Trash2, MapPin, Eye, X, CreditCard, User, Check, Calendar } from 'lucide-react';

// import { toast } from 'react-toastify'; // Not used in this component directly anymore if deleteClient handles toast
import { useAuth } from '../../../../context/AuthProvider';
import { useClientsContext, Client } from '../../../../context/ClientsProvider';
import { ClientForm } from './ClientForm';

const ClientDetailsModal = ({ client, onClose, user, onUpdate }: { client: Client, onClose: () => void, user: any, onUpdate: (updatedClient: Client) => Promise<void> }) => {

    if (!client) return null;

    const isAdminOrMentor = user?.isAdmin || user?.designation === 'Admin' || user?.designation === 'Manager' || user?.designation === 'Mentor';
    const isAdmin = user?.isAdmin || user?.designation === 'Admin';
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [newDate, setNewDate] = useState(client.createdAt ? new Date(client.createdAt).toISOString().slice(0, 16) : '');

    const handleSaveDate = async () => {
        if (!newDate) return;
        const updatedClient = { ...client, createdAt: new Date(newDate).toISOString() };
        await onUpdate(updatedClient);
        setIsEditingDate(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        {client.logo ? (
                            <img
                                src={`${import.meta.env.VITE_BACKEND_URL}/${client.logo}`}
                                alt={client.companyName}
                                className="w-12 h-12 object-cover rounded-xl border-2 border-white shadow-sm"
                            />
                        ) : (
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                                <Building2 className="w-6 h-6" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">{client.companyName}</h2>
                            <p className="text-sm text-gray-500 font-medium">{client.industry}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">About Company</h3>
                                <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                                    "{client.companyInfo || 'No company info available.'}"
                                </p>
                                {/* Created Date Display */}
                                <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="font-semibold whitespace-nowrap">Client Since:</span>
                                    </div>
                                    {isEditingDate ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="datetime-local"
                                                value={newDate}
                                                onChange={(e) => setNewDate(e.target.value)}
                                                className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                            <button
                                                onClick={handleSaveDate}
                                                className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                                                title="Save Date"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setIsEditingDate(false)}
                                                className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                                title="Cancel"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="mt-1">
                                                {client.createdAt
                                                    ? new Date(client.createdAt).toLocaleString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'N/A'
                                                }
                                            </span>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => {
                                                        setNewDate(client.createdAt ? new Date(client.createdAt).toISOString().slice(0, 16) : '');
                                                        setIsEditingDate(true);
                                                    }}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit Date"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Website</p>
                                    <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-2 truncate">
                                        <Globe className="w-3.5 h-3.5" /> {client.websiteUrl?.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">LinkedIn</p>
                                    <a href={client.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline text-sm font-medium flex items-center gap-2 truncate">
                                        <Linkedin className="w-3.5 h-3.5" /> Company Profile
                                    </a>
                                </div>
                            </section>

                            {isAdminOrMentor && (
                                <section className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" /> Commercial Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-blue-100/50">
                                            <span className="text-sm text-gray-600">Payout Option</span>
                                            <span className="text-sm font-bold text-blue-900">{client.payoutOption}</span>
                                        </div>
                                        {(client.payoutOption === 'Agreement Percentage' || client.payoutOption === 'Both') && (
                                            <div className="flex justify-between items-center py-2 border-b border-blue-100/50">
                                                <span className="text-sm text-gray-600">Agreement %</span>
                                                <span className="text-sm font-bold text-blue-900">{client.agreementPercentage}%</span>
                                            </div>
                                        )}
                                        {(client.payoutOption === 'Flat Pay' || client.payoutOption === 'Both') && (
                                            <div className="flex justify-between items-center py-2 border-b border-blue-100/50">
                                                <span className="text-sm text-gray-600">Flat Pay Amount</span>
                                                <span className="text-sm font-bold text-green-700">₹{Number(client.flatPayAmount).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Contacts & BD Info */}
                        <div className="space-y-6">
                            {isAdminOrMentor && client.bdExecutive && (
                                <section className="p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Business Development
                                    </h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            {client.bdExecutive.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{client.bdExecutive}</p>
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Executive Lead</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5 ml-1">
                                        {client.bdExecutiveEmail && (
                                            <div className="flex items-center gap-3 text-sm text-gray-700 bg-white/50 p-2.5 rounded-lg border border-emerald-50">
                                                <Mail className="w-4 h-4 text-emerald-500" />
                                                <a href={`mailto:${client.bdExecutiveEmail}`} className="hover:text-emerald-700 transition-colors truncate">{client.bdExecutiveEmail}</a>
                                            </div>
                                        )}
                                        {client.bdExecutivePhone && (
                                            <div className="flex items-center gap-3 text-sm text-gray-700 bg-white/50 p-2.5 rounded-lg border border-emerald-50">
                                                <Phone className="w-4 h-4 text-emerald-500" />
                                                <a href={`tel:${client.bdExecutivePhone}`} className="hover:text-emerald-700 transition-colors">{client.bdExecutivePhone}</a>
                                            </div>
                                        )}
                                        {client.noOfRequirements && (
                                            <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center gap-3">
                                                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                    {client.noOfRequirements} Total Requirements
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Points of Contact</h3>
                                <div className="space-y-3">
                                    {client.pocs?.map((poc, idx) => (
                                        <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {poc.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900 text-sm">{poc.name}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    <span className="truncate">{poc.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    <span>{poc.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Billing Section (Full Width) */}
                    {isAdminOrMentor && client.billingDetails && client.billingDetails.length > 0 && (
                        <section className="mt-8 pt-8 border-t">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Billing Locations</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {client.billingDetails.map((detail, idx) => (
                                    <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-4 hover:shadow-sm transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Office Address</p>
                                                <p className="text-sm text-gray-700 font-medium leading-relaxed">{detail.address}</p>
                                                <p className="text-xs text-slate-500 mt-1 font-semibold">{detail.state}</p>
                                            </div>
                                        </div>
                                        {detail.gstNumber && (
                                            <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">GST Number</span>
                                                <span className="text-xs font-mono font-bold text-slate-700">{detail.gstNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ClientsManager = ({ initialFormOpen = false }: { initialFormOpen?: boolean }) => {
    const { user } = useAuth();
    const {
        paginatedClients,
        pagination,
        fetchPaginatedClients,
        loading,
        // fetchClients, // Keep for backward compatibility or refresh after edit/delete
        deleteClient, // Assuming deleteClient is available from context
        bdExecutives,
        fetchBDExecutives,
        updateClient
    } = useClientsContext();

    const [showForm, setShowForm] = useState(initialFormOpen);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedBDExecutive, setSelectedBDExecutive] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Fetch paginated clients on change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPaginatedClients(currentPage, limit, searchTerm, startDate, endDate, selectedBDExecutive);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, startDate, endDate, selectedBDExecutive]);

    // Reset to page 1 on search or filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, selectedBDExecutive]);

    // Initial load
    useEffect(() => {
        if (initialFormOpen) setShowForm(true);
        fetchBDExecutives();
    }, [initialFormOpen]);

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setShowForm(true);
    };

    const handleDelete = async (clientId: string) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            await deleteClient(clientId);
            // Refresh current page
            fetchPaginatedClients(currentPage, limit, searchTerm, startDate, endDate, selectedBDExecutive);
        }
    };

    // We now use `paginatedClients` directly

    const handleClientUpdate = async (updatedClient: Client) => {
        if (updatedClient._id) {
            const result = await updateClient(updatedClient._id, updatedClient);
            if (result) {
                setSelectedClientForDetails(result);
                // Refresh list to show updated data if necessary (though details are updated immediately in modal)
                fetchPaginatedClients(currentPage, limit, searchTerm, startDate, endDate, selectedBDExecutive);
            }
        }
    };

    if (loading && paginatedClients.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Clients</h2>
                    <p className="text-gray-600">Manage your client companies and contacts</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedClient(null);
                        setShowForm(true);
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Client</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-600"
                            placeholder="From Date"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-600"
                            placeholder="To Date"
                        />
                    </div>
                    <select
                        value={selectedBDExecutive}
                        onChange={(e) => setSelectedBDExecutive(e.target.value)}
                        className="px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-600 min-w-[150px]"
                    >
                        <option value="">All BD Executives</option>
                        {bdExecutives.map((exec) => (
                            <option key={exec._id} value={exec.name}>
                                {exec.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{pagination?.totalClients || 0} Total Partners</span>
                </div>
            </div>

            {/* Client List - Table View */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {paginatedClients.length === 0 && !loading ? (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Building2 className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No matching clients</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {searchTerm ? "We couldn't find any results for your search. Try different keywords." : "Your database is empty. Start building your client network today!"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Company</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Industry</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Agreement %</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">BD Executive</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <span className="text-sm font-medium text-gray-400">Loading directory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedClients.map((client) => (
                                        <tr key={client._id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0">
                                                        {client.logo ? (
                                                            <img
                                                                src={`${import.meta.env.VITE_BACKEND_URL}/${client.logo}`}
                                                                alt=""
                                                                className="w-10 h-10 object-cover rounded-lg border border-gray-100 shadow-sm"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                                                {client.companyName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-901 group-hover:text-blue-700 transition-colors">{client.companyName}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium md:hidden">{client.industry}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[11px] font-bold">
                                                    {client.industry}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="text-gray-600 font-medium text-sm">
                                                    {client.agreementPercentage ? `${client.agreementPercentage}%` : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="text-gray-600 font-medium text-sm">
                                                    {client.bdExecutive || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={client.active !== false ? 'active' : 'inactive'}
                                                    onChange={async (e) => {
                                                        const isActive = e.target.value === 'active';
                                                        const updatedClient = { ...client, active: isActive };
                                                        await updateClient(client._id!, updatedClient);
                                                        fetchPaginatedClients(currentPage, limit, searchTerm, startDate, endDate, selectedBDExecutive);
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${client.active !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setSelectedClientForDetails(client)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(client)}
                                                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => client._id && handleDelete(client._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {
                paginatedClients.length > 0 && (
                    <div className="p-4 flex items-center justify-between bg-white rounded-xl shadow-md border border-gray-200">
                        <div className="text-sm text-slate-500">
                            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination?.totalClients || 0)} of {pagination?.totalClients || 0} clients
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 bg-slate-100 rounded">
                                Page {currentPage} of {pagination?.totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(pagination?.totalPages || 1, p + 1))}
                                disabled={currentPage === (pagination?.totalPages || 1)}
                                className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Client Form Modal */}
            {showForm && (
                <ClientForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        fetchPaginatedClients(currentPage, limit, searchTerm, startDate, endDate, selectedBDExecutive);
                        setShowForm(false);
                    }}
                    initialData={selectedClient}
                />
            )}

            {/* Detail View Modal */}
            {selectedClientForDetails && (
                <ClientDetailsModal
                    client={selectedClientForDetails}
                    onClose={() => setSelectedClientForDetails(null)}
                    user={user}
                    onUpdate={handleClientUpdate}
                />
            )}
        </div >
    );
};
