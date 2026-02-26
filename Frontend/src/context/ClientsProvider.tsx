import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/config';

const API_URL = `${API_BASE_URL}/api/clients`;

export interface BillingDetail {
    _id?: string;
    address: string;
    state: string;
    gstNumber: string;
}

export interface POC {
    name: string;
    email: string;
    phone: string;
    altPhone: string;
    linkedinUrl: string;
}

export interface BDExecutive {
    _id: string;
    name: string;
    email: string;
    phone: string;
}

export interface Client {
    _id?: string;
    companyName: string;
    websiteUrl: string;
    industry: string;
    linkedinUrl: string;
    companyInfo: string;
    logo?: string;
    address?: string;
    state?: string;
    agreementPercentage?: number | string;
    payoutOption?: 'Agreement Percentage' | 'Flat Pay' | 'Both';
    flatPayAmount?: number | string;
    gstNumber?: string;
    billingDetails: BillingDetail[];
    pocs: POC[];
    bdExecutive?: string;
    bdExecutiveEmail?: string;
    bdExecutivePhone?: string;
    createdAt?: string; // Added field
    createdBy?: string | {
        _id: string;
        name: string;
        email: string;
        designation: string;
    };
    active?: boolean;
}

interface ClientsContextType {
    clients: Client[];
    paginatedClients: Client[]; // New
    pagination: { // New
        currentPage: number;
        totalPages: number;
        totalClients: number;
    };
    loading: boolean;
    error: string | null;
    fetchClients: () => Promise<void>;
    fetchPaginatedClients: (page: number, limit: number, search?: string, startDate?: string, endDate?: string, bdExecutive?: string) => Promise<void>; // New
    fetchClientById: (id: string) => Promise<Client | null>;
    createClient: (data: Client, logoFile?: File) => Promise<Client | null>;
    updateClient: (id: string, data: Client, logoFile?: File) => Promise<Client | null>;
    deleteClient: (id: string) => Promise<boolean>;
    bdExecutives: BDExecutive[];
    fetchBDExecutives: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [paginatedClients, setPaginatedClients] = useState<Client[]>([]); // New State
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalClients: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bdExecutives, setBdExecutives] = useState<BDExecutive[]>([]);

    // Fetch all clients (Backward compatibility)
    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            if (data.success) {
                setClients(data.clients);
            } else {
                throw new Error(data.message || 'Failed to fetch clients');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBDExecutives = useCallback(async () => {
        try {
            const response = await fetch('https://jtcrm.in/api/api/users/role/bd-executives');
            const data = await response.json();
            setBdExecutives(data);
        } catch (err: any) {
            console.error('Error fetching BD executives:', err);
        }
    }, []);

    // New: Fetch Paginated Clients
    const fetchPaginatedClients = useCallback(async (page: number, limit: number, search: string = '', startDate: string = '', endDate: string = '', bdExecutive: string = '') => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                startDate,
                endDate,
                bdExecutive
            }).toString();

            const response = await fetch(`${API_URL}?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                setPaginatedClients(data.clients);
                setPagination({
                    currentPage: data.currentPage,
                    totalPages: data.totalPages,
                    totalClients: data.totalClients
                });
            } else {
                throw new Error(data.message || 'Failed to fetch clients');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching paginated clients:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch single client by ID
    const fetchClientById = useCallback(async (id: string): Promise<Client | null> => {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            const data = await response.json();

            if (data.success) {
                return data.client;
            }
            throw new Error(data.message || 'Failed to fetch client');
        } catch (err: any) {
            console.error('Error fetching client:', err);
            return null;
        }
    }, []);

    // Create new client
    const createClient = useCallback(async (clientData: Client, logoFile?: File): Promise<Client | null> => {
        try {
            setLoading(true);

            let response;
            if (logoFile) {
                const formData = new FormData();
                formData.append('companyName', clientData.companyName);
                formData.append('websiteUrl', clientData.websiteUrl);
                formData.append('industry', clientData.industry);
                formData.append('linkedinUrl', clientData.linkedinUrl);
                formData.append('companyInfo', clientData.companyInfo);
                if (clientData.agreementPercentage && clientData.agreementPercentage !== '') formData.append('agreementPercentage', String(clientData.agreementPercentage));
                if (clientData.payoutOption !== undefined) formData.append('payoutOption', clientData.payoutOption);
                if (clientData.flatPayAmount && clientData.flatPayAmount !== '') formData.append('flatPayAmount', String(clientData.flatPayAmount));
                if (clientData.gstNumber !== undefined) formData.append('gstNumber', clientData.gstNumber);
                formData.append('pocs', JSON.stringify(clientData.pocs));
                formData.append('billingDetails', JSON.stringify(clientData.billingDetails || []));
                if (clientData.bdExecutive) formData.append('bdExecutive', clientData.bdExecutive);
                if (clientData.bdExecutiveEmail) formData.append('bdExecutiveEmail', clientData.bdExecutiveEmail);
                if (clientData.bdExecutivePhone) formData.append('bdExecutivePhone', clientData.bdExecutivePhone);
                formData.append('logo', logoFile);

                if (clientData.createdBy) {
                    const createdByValue = typeof clientData.createdBy === 'object'
                        ? (clientData.createdBy as any)._id
                        : clientData.createdBy;
                    formData.append('createdBy', createdByValue);
                }

                response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData,
                });
            } else {
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(clientData),
                });
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create client');
            }

            // Add new client to state
            setClients((prev) => [data.client, ...prev]);
            toast.success('Client created successfully');
            return data.client;
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Failed to create client');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Update existing client
    const updateClient = useCallback(async (id: string, clientData: Client, logoFile?: File): Promise<Client | null> => {
        try {
            setLoading(true);

            let response;
            if (logoFile) {
                const formData = new FormData();
                formData.append('companyName', clientData.companyName);
                formData.append('websiteUrl', clientData.websiteUrl);
                formData.append('industry', clientData.industry);
                formData.append('linkedinUrl', clientData.linkedinUrl);
                formData.append('companyInfo', clientData.companyInfo);
                if (clientData.agreementPercentage && clientData.agreementPercentage !== '') formData.append('agreementPercentage', String(clientData.agreementPercentage));
                if (clientData.payoutOption !== undefined) formData.append('payoutOption', clientData.payoutOption);
                if (clientData.flatPayAmount && clientData.flatPayAmount !== '') formData.append('flatPayAmount', String(clientData.flatPayAmount));
                if (clientData.gstNumber !== undefined) formData.append('gstNumber', clientData.gstNumber);
                formData.append('pocs', JSON.stringify(clientData.pocs));
                formData.append('billingDetails', JSON.stringify(clientData.billingDetails || []));
                if (clientData.bdExecutive) formData.append('bdExecutive', clientData.bdExecutive);
                if (clientData.bdExecutiveEmail) formData.append('bdExecutiveEmail', clientData.bdExecutiveEmail);
                if (clientData.bdExecutivePhone) formData.append('bdExecutivePhone', clientData.bdExecutivePhone);
                if (clientData.active !== undefined) formData.append('active', String(clientData.active)); // Append active
                if (clientData.createdAt) formData.append('createdAt', clientData.createdAt); // Append createdAt
                formData.append('logo', logoFile);

                response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    body: formData,
                });
            } else {
                response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(clientData),
                });
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update client');
            }

            // Update client in state
            setClients((prev) => prev.map((client) => (client._id === id ? data.client : client)));
            toast.success('Client updated successfully');
            return data.client;
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Failed to update client');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete client
    const deleteClient = useCallback(async (id: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete client');
            }

            // Remove client from state
            setClients((prev) => prev.filter((client) => client._id !== id));
            toast.success('Client deleted successfully');
            return true;
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Failed to delete client');
            return false;
        }
    }, []);

    // Auto-fetch clients on mount
    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const contextValue = useMemo(() => ({
        clients,
        paginatedClients,
        pagination,
        loading,
        error,
        fetchClients,
        fetchPaginatedClients,
        fetchClientById,
        createClient,
        updateClient,
        deleteClient,
        bdExecutives,
        fetchBDExecutives
    }), [
        clients,
        paginatedClients,
        pagination,
        loading,
        error,
        fetchClients,
        fetchPaginatedClients,
        fetchClientById,
        createClient,
        updateClient,
        deleteClient,
        bdExecutives,
        fetchBDExecutives
    ]);

    return (
        <ClientsContext.Provider value={contextValue}>
            {children}
        </ClientsContext.Provider>
    );
};

// Custom hook for using the context
export const useClientsContext = () => {
    const context = useContext(ClientsContext);
    if (!context) {
        throw new Error('useClientsContext must be used within a ClientsProvider');
    }
    return context;
};
