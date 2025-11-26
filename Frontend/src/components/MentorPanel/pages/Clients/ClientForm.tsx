import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthProvider';
import { useClientsContext } from '../../../../context/ClientsProvider';
import { API_BASE_URL } from '../../../../config/config';

interface POC {
    name: string;
    email: string;
    phone: string;
    altPhone: string;
    linkedinUrl: string;
}

interface ClientFormData {
    _id?: string;
    companyName: string;
    websiteUrl: string;
    industry: string;
    linkedinUrl: string;
    companyInfo: string;
    logo?: string;
    pocs: POC[];
}

interface ClientFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: ClientFormData | null;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onClose, onSuccess, initialData }) => {
    const { user } = useAuth();
    const { createClient, updateClient } = useClientsContext();
    const [formData, setFormData] = useState<ClientFormData>(initialData || {
        companyName: '',
        websiteUrl: '',
        industry: '',
        linkedinUrl: '',
        companyInfo: '',
        pocs: [{ name: '', email: '', phone: '', altPhone: '', linkedinUrl: '' }]
    });
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);

    const handlePOCChange = (index: number, field: keyof POC, value: string) => {
        const newPOCs = [...(formData.pocs || [])];
        newPOCs[index] = { ...newPOCs[index], [field]: value };
        setFormData({ ...formData, pocs: newPOCs });
    };

    const addPOC = () => {
        setFormData({
            ...formData,
            pocs: [...(formData.pocs || []), { name: '', email: '', phone: '', altPhone: '', linkedinUrl: '' }]
        });
    };

    const removePOC = (index: number) => {
        if ((formData.pocs || []).length > 1) {
            const newPOCs = (formData.pocs || []).filter((_, i) => i !== index);
            setFormData({ ...formData, pocs: newPOCs });
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            setLogoFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate that at least one POC has required fields (name and email)
            const validPOCs = formData.pocs?.filter(poc => poc.name.trim() && poc.email.trim());

            if (!validPOCs || validPOCs.length === 0) {
                toast.error('At least one Point of Contact with Name and Email is required');
                setLoading(false);
                return;
            }

            // Check for duplicate phone numbers among POCs
            const phoneNumbers = formData.pocs
                ?.map(poc => poc.phone.trim())
                .filter(phone => phone !== ''); // Only check non-empty phone numbers

            const duplicatePhones = phoneNumbers?.filter((phone, index) =>
                phoneNumbers.indexOf(phone) !== index
            );

            if (duplicatePhones && duplicatePhones.length > 0) {
                toast.error('Duplicate phone numbers found. Each POC must have a unique phone number.');
                setLoading(false);
                return;
            }

            // Prepare payload
            const payload = {
                ...formData,
                createdBy: !initialData || !initialData._id ? user?._id : undefined
            };

            let result;
            if (initialData && initialData._id) {
                result = await updateClient(initialData._id, payload, logoFile || undefined);
            } else {
                result = await createClient(payload, logoFile || undefined);
            }

            if (result) {
                // Wait for data refresh before closing
                await onSuccess();
                onClose();
            }
        } catch (err: any) {
            console.error('Error saving client:', err);
            // Error is handled in context
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialData ? 'Edit Client' : 'Add New Client'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Logo Upload Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Company Logo</h3>
                        <div className="flex items-center gap-4">
                            {logoPreview ? (
                                <div className="relative">
                                    <img
                                        src={logoPreview.startsWith('uploads') ? `${API_BASE_URL}/${logoPreview}` : logoPreview}
                                        alt="Company Logo"
                                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                </div>
                            )}
                            <div>
                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                    <Upload className="w-4 h-4" />
                                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG, GIF)</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Company Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                                <input
                                    type="text"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.websiteUrl}
                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                                <input
                                    type="url"
                                    value={formData.linkedinUrl}
                                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Info</label>
                                <textarea
                                    value={formData.companyInfo}
                                    onChange={(e) => setFormData({ ...formData, companyInfo: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* POC Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700">Points of Contact</h3>
                                <p className="text-xs text-gray-500 mt-1">At least one POC with Name and Email is required</p>
                            </div>
                            <button
                                type="button"
                                onClick={addPOC}
                                className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add POC
                            </button>
                        </div>

                        {(formData.pocs || []).map((poc, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border relative">
                                {(formData.pocs || []).length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removePOC(index)}
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={poc.name}
                                            onChange={(e) => handlePOCChange(index, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg bg-white"
                                            placeholder="Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={poc.email}
                                            onChange={(e) => handlePOCChange(index, 'email', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg bg-white"
                                            placeholder="Email"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={poc.phone}
                                            onChange={(e) => handlePOCChange(index, 'phone', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg bg-white"
                                            placeholder="Phone"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Alt Phone</label>
                                        <input
                                            type="tel"
                                            value={poc.altPhone}
                                            onChange={(e) => handlePOCChange(index, 'altPhone', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg bg-white"
                                            placeholder="Alt Phone"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">LinkedIn URL</label>
                                        <input
                                            type="url"
                                            value={poc.linkedinUrl}
                                            onChange={(e) => handlePOCChange(index, 'linkedinUrl', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg bg-white"
                                            placeholder="LinkedIn Profile"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Client')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
