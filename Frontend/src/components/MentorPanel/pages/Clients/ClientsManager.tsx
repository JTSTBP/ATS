import { useState, useEffect } from 'react';
import { Building2, Search, Plus, X, Globe, Linkedin, Mail, Phone, Calendar, Eye, Pencil, Trash2 } from 'lucide-react';

// import { toast } from 'react-toastify'; // Not used in this component directly anymore if deleteClient handles toast
import { useAuth } from '../../../../context/AuthProvider';
import { useClientsContext, Client } from '../../../../context/ClientsProvider';
import { ClientForm } from './ClientForm';
import { getImageUrl } from '../../../../utils/imageUtils';

const ClientDetailsModal = ({ client, onClose, user }: { client: Client, onClose: () => void, user: any }) => {
    if (!client) return null;

    const isAdminOrMentor = user?.isAdmin || user?.designation === 'Admin' || user?.designation === 'Manager' || user?.designation === 'Mentor';

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 sm:p-8 border-b bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center border border-slate-100 overflow-hidden">
                            {client.logo ? (
                                <img
                                    src={getImageUrl(client.logo)}
                                    alt={client.companyName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Building2 className="w-8 h-8 text-blue-600" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                                {client.companyName}
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase tracking-widest">
                                    {client.industry}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {client._id?.substring(18)}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-2xl transition-all group shadow-sm sm:shadow-none border border-transparent hover:border-slate-100"
                    >
                        <X size={24} className="text-slate-400 group-hover:text-slate-600" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
                        {/* Left Column: Main Info */}
                        <div className="lg:col-span-2 space-y-10">
                            <section>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Company Profile
                                </h3>
                                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                        "{client.companyInfo || 'No detailed company overview provided.'}"
                                    </p>

                                    <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Since</span>
                                            <span className="text-xs font-bold text-slate-700">
                                                {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        {client.websiteUrl && (
                                            <a href={client.websiteUrl} target="_blank" rel="noopener" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                                                <Globe size={14} />
                                                <span className="text-xs font-bold">Website</span>
                                            </a>
                                        )}
                                        {client.linkedinUrl && (
                                            <a href={client.linkedinUrl} target="_blank" rel="noopener" className="flex items-center gap-2 text-[#0077b5] hover:opacity-80 transition-opacity">
                                                <Linkedin size={14} />
                                                <span className="text-xs font-bold">LinkedIn</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    Points of Contact ({client.pocs?.length || 0})
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {client.pocs?.map((poc, idx) => (
                                        <div key={idx} className="group bg-white p-5 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    {poc.name.charAt(0)}
                                                </div>
                                                <span className="font-black text-slate-800 text-sm tracking-tight">{poc.name}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <a href={`mailto:${poc.email}`} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors truncate">
                                                    <Mail size={12} /> {poc.email}
                                                </a>
                                                <a href={`tel:${poc.phone}`} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <Phone size={12} /> {poc.phone}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Meta & Logistics */}
                        <div className="space-y-10">
                            {isAdminOrMentor && (
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Commercials
                                    </h3>
                                    <div className="bg-emerald-50/30 rounded-3xl p-6 border border-emerald-100/50 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Payout model</p>
                                            <p className="text-sm font-black text-slate-800">{client.payoutOption}</p>
                                        </div>
                                        {client.agreementPercentage && (
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Agreement</p>
                                                <p className="text-sm font-black text-slate-800">{client.agreementPercentage}% Commission</p>
                                            </div>
                                        )}
                                        {client.flatPayAmount && (
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Flat Fee</p>
                                                <p className="text-sm font-black text-slate-800">₹{Number(client.flatPayAmount).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Lead Ownership
                                </h3>
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm font-black text-slate-400">
                                        {client.bdExecutive?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 tracking-tight">{client.bdExecutive || 'System Assigned'}</p>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">BD Executive</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    Billing Sites ({client.billingDetails?.length || 0})
                                </h3>
                                <div className="space-y-3">
                                    {client.billingDetails?.map((detail, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-700 mb-1 leading-snug">{detail.address}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{detail.state}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 sm:p-8 border-t bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-center"
                    >
                        Close Portal
                    </button>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Partners directory</h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Manage your client companies and contacts</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedClient(null);
                        setShowForm(true);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm">Add New Client</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                    <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                        />
                    </div>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-600"
                    />

                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-600"
                    />

                    <select
                        value={selectedBDExecutive}
                        onChange={(e) => setSelectedBDExecutive(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                    >
                        <option value="">All BD Executives</option>
                        {bdExecutives.map((exec) => (
                            <option key={exec._id} value={exec.name}>
                                {exec.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{pagination?.totalClients || 0} Total Partners found</span>
                </div>
            </div>

            {/* Client List - Table View */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {paginatedClients.length === 0 && !loading ? (
                    <div className="p-12 sm:p-20 text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">No matching partners</h3>
                        <p className="text-xs sm:text-sm font-bold text-slate-400 max-w-sm mx-auto">
                            {searchTerm ? "We couldn't find any results for your search. Try different keywords." : "Your database is empty. Start building your client network today!"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Company</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agreement</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">BD Lead</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
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
                                                                src={getImageUrl(client.logo)}
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
