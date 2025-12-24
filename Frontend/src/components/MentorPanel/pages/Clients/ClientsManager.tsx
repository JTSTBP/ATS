import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Globe, Linkedin, Phone, Mail, Pencil, Trash2, MapPin, FileText, Hash } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthProvider';
import { ClientForm } from './ClientForm';

interface Client {
    _id: string;
    companyName: string;
    websiteUrl: string;
    industry: string;
    linkedinUrl: string;
    companyInfo: string;
    logo?: string;
    address?: string;
    state?: string;
    agreementPercentage?: number;
    gstNumber?: string;
    pocs: {
        name: string;
        email: string;
        phone: string;
        altPhone: string;
        linkedinUrl: string;
    }[];
    createdBy?: {
        _id: string;
        name: string;
        email: string;
        designation: string;
    };
}

export const ClientsManager = ({ initialFormOpen = false }: { initialFormOpen?: boolean }) => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(initialFormOpen);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const fetchClients = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clients`);
            const data = await response.json();
            if (data.success && data.clients) {
                setClients(data.clients);
            } else {
                // Fallback for old format
                setClients(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setShowForm(true);
    };

    const handleDelete = async (clientId: string) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clients/${clientId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    toast.success('Client deleted successfully');
                    fetchClients();
                } else {
                    toast.error('Failed to delete client');
                }
            } catch (error) {
                console.error('Error deleting client:', error);
                toast.error('Error deleting client');
            }
        }
    };

    const filteredClients = clients?.filter(client =>
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
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
                        placeholder="Search clients by name or industry..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Client List */}
            <div className="space-y-4">
                {filteredClients.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No clients found</h3>
                        <p className="text-gray-500">
                            {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first client"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredClients.map((client) => (
                            <div key={client._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
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
                                                {client.createdBy && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Created by: <span className="font-medium text-gray-600">{client.createdBy.name}</span>
                                                        {client.createdBy.designation && (
                                                            <span className="ml-1">({client.createdBy.designation})</span>
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
                                                    onClick={() => handleDelete(client._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                                    title="Delete Client"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 mb-6 text-sm">{client.companyInfo}</p>

                                    {(user?.isAdmin || user?.designation === 'Admin') && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            {client.address && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">Address</p>
                                                        <p className="text-sm text-slate-700">{client.address}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {client.state && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">State</p>
                                                        <p className="text-sm text-slate-700">{client.state}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {client.agreementPercentage !== undefined && (
                                                <div className="flex items-start gap-2">
                                                    <FileText className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">Agreement %</p>
                                                        <p className="text-sm text-slate-700">{client.agreementPercentage}%</p>
                                                    </div>
                                                </div>
                                            )}
                                            {client.gstNumber && (
                                                <div className="flex items-start gap-2">
                                                    <Hash className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">GST Number</p>
                                                        <p className="text-sm text-slate-700">{client.gstNumber}</p>
                                                    </div>
                                                </div>
                                            )}
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

            {/* Client Form Modal */}
            {showForm && (
                <ClientForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        fetchClients();
                        setShowForm(false);
                    }}
                    initialData={selectedClient}
                />
            )}
        </div>
    );
};
