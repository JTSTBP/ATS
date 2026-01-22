import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Globe, Linkedin, Phone, Mail, Pencil, Trash2, MapPin, Hash } from 'lucide-react';
// import { toast } from 'react-toastify'; // Not used in this component directly anymore if deleteClient handles toast
import { useAuth } from '../../../../context/AuthProvider';
import { useClientsContext, Client } from '../../../../context/ClientsProvider';
import { ClientForm } from './ClientForm';

export const ClientsManager = ({ initialFormOpen = false }: { initialFormOpen?: boolean }) => {
    const { user } = useAuth();
    const {
        paginatedClients,
        pagination,
        fetchPaginatedClients,
        loading,
        // fetchClients, // Keep for backward compatibility or refresh after edit/delete
        deleteClient // Assuming deleteClient is available from context
    } = useClientsContext();

    const [showForm, setShowForm] = useState(initialFormOpen);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Fetch paginated clients on change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPaginatedClients(currentPage, limit, searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm]);

    // Reset to page 1 on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Initial load
    useEffect(() => {
        if (initialFormOpen) setShowForm(true);
    }, [initialFormOpen]);

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setShowForm(true);
    };

    const handleDelete = async (clientId: string) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            await deleteClient(clientId);
            // Refresh current page
            fetchPaginatedClients(currentPage, limit, searchTerm);
        }
    };

    // REMOVED: filteredClients client-side logic
    // We now use `paginatedClients` directly

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

            {/* Search */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search clients by name, industry, website..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Client List */}
            <div className="space-y-4">
                {paginatedClients.length === 0 && !loading ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No clients found</h3>
                        <p className="text-gray-500">
                            {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first client"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {loading && (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                        {!loading && paginatedClients.map((client) => (
                            <div key={client._id || Math.random()} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-start gap-4">
                                            {/* Company Logo */}
                                            <div className="flex-shrink-0">
                                                {client.logo ? (
                                                    <img
                                                        src={`${import.meta.env.VITE_BACKEND_URL}/${client.logo}`}
                                                        alt={client.companyName}
                                                        className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                                        <Building2 className="w-8 h-8 text-blue-600" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Company Info */}
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800">{client.companyName}</h3>
                                                <p className="text-sm text-gray-500">{client.industry}</p>
                                                {client.payoutOption && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100 italic">
                                                            {client.payoutOption}
                                                        </span>
                                                        {(client.payoutOption === 'Agreement Percentage' || client.payoutOption === 'Both') && client.agreementPercentage && (
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                                                                {client.agreementPercentage}%
                                                            </span>
                                                        )}
                                                        {(client.payoutOption === 'Flat Pay' || client.payoutOption === 'Both') && client.flatPayAmount && (
                                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold border border-emerald-100">
                                                                ₹{Number(client.flatPayAmount).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {client.createdBy && typeof client.createdBy === 'object' && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Created by: <span className="font-medium text-gray-600">{(client.createdBy as any).name}</span>
                                                        {(client.createdBy as any).designation && (
                                                            <span className="ml-1">({(client.createdBy as any).designation})</span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-2">
                                                {client.websiteUrl && (
                                                    <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-full">
                                                        <Globe className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {client.linkedinUrl && (
                                                    <a href={client.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-700 bg-gray-50 rounded-full">
                                                        <Linkedin className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="border-l pl-3 flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(client)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                                    title="Edit Client"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => client._id && handleDelete(client._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                                    title="Delete Client"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 mb-6 text-sm">{client.companyInfo}</p>

                                    {(user?.isAdmin || user?.designation === 'Admin' || user?.designation === 'Finance') && client.billingDetails && client.billingDetails.length > 0 && (
                                        <div className="space-y-4 mb-6">
                                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Billing Locations</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {client.billingDetails.map((detail, idx) => (
                                                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col gap-3">
                                                        {detail.address && (
                                                            <div className="flex items-start gap-2">
                                                                <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Address</p>
                                                                    <p className="text-xs text-slate-700 line-clamp-2">{detail.address}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center mt-auto">
                                                            {detail.state && (
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3 text-slate-400" />
                                                                    <p className="text-[10px] text-slate-700">{detail.state}</p>
                                                                </div>
                                                            )}

                                                        </div>
                                                        {detail.gstNumber && (
                                                            <div className="flex items-center gap-1 border-t pt-2 mt-1">
                                                                <Hash className="w-3 h-3 text-slate-400" />
                                                                <p className="text-[10px] text-slate-700 font-medium">GST: {detail.gstNumber}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Only show POC section if there are POCs */}
                                    {client.pocs && client.pocs.length > 0 && (
                                        <div className="border-t pt-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Points of Contact</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {client.pocs.map((poc, idx) => (
                                                    <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                                                {poc.name.charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-gray-800 text-sm">{poc.name}</span>
                                                        </div>
                                                        <div className="space-y-1 text-xs text-gray-500">
                                                            {poc.email && (
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="w-3 h-3" />
                                                                    <a href={`mailto:${poc.email}`} className="hover:text-blue-600">{poc.email}</a>
                                                                </div>
                                                            )}
                                                            {poc.phone && (
                                                                <div className="flex items-center gap-2">
                                                                    <Phone className="w-3 h-3" />
                                                                    <a href={`tel:${poc.phone}`} className="hover:text-blue-600">{poc.phone}</a>
                                                                </div>
                                                            )}
                                                            {poc.linkedinUrl && (
                                                                <div className="flex items-center gap-2">
                                                                    <Linkedin className="w-3 h-3" />
                                                                    <a href={poc.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 truncate">LinkedIn</a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {paginatedClients.length > 0 && (
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
            )}

            {/* Client Form Modal */}
            {showForm && (
                <ClientForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        fetchPaginatedClients(currentPage, limit, searchTerm);
                        setShowForm(false);
                    }}
                    initialData={selectedClient}
                />
            )}
        </div>
    );
};
