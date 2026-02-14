import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthProvider';
import { useClientsContext } from '../../../../context/ClientsProvider';
import { getImageUrl } from '../../../../utils/imageUtils';

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
    address?: string;
    state?: string;
    agreementPercentage?: number | string;
    payoutOption?: 'Agreement Percentage' | 'Flat Pay' | 'Both';
    flatPayAmount?: number | string;
    gstNumber?: string;
    billingDetails: {
        address: string;
        state: string;
        gstNumber: string;
    }[];
    pocs: POC[];
    bdExecutive?: string;
    bdExecutiveEmail?: string;
    bdExecutivePhone?: string;
    noOfRequirements?: number | string;
    createdAt?: string;
}

interface ClientFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: ClientFormData | null;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onClose, onSuccess, initialData }) => {
    const { user } = useAuth();
    const { createClient, updateClient, bdExecutives, fetchBDExecutives } = useClientsContext();
    const [formData, setFormData] = useState<ClientFormData>(initialData || {
        companyName: '',
        websiteUrl: '',
        industry: '',
        linkedinUrl: '',
        companyInfo: '',
        address: '',
        state: '',
        agreementPercentage: '',
        payoutOption: 'Agreement Percentage',
        flatPayAmount: '',
        gstNumber: '',
        bdExecutive: '',
        bdExecutiveEmail: '',
        bdExecutivePhone: '',
        noOfRequirements: '',
        createdAt: '',
        billingDetails: [{ address: '', state: '', gstNumber: '' }],
        pocs: [{ name: '', email: '', phone: '', altPhone: '', linkedinUrl: '' }]
    });
    const [loading, setLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo ? getImageUrl(initialData.logo) : null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    useEffect(() => {
        if (bdExecutives.length === 0) {
            fetchBDExecutives();
        }
    }, [bdExecutives.length, fetchBDExecutives]);

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

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone: string) => {
        return /^\d{10,15}$/.test(phone);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate Logo
            if (!logoFile && !logoPreview) {
                toast.error('Company Logo is required');
                setLoading(false);
                return;
            }

            // Validate that at least one POC has required fields (name and email)
            const validPOCs = formData.pocs?.filter(poc => poc.name.trim() && poc.email.trim());

            if (!validPOCs || validPOCs.length === 0) {
                toast.error('At least one Point of Contact with Name and Email is required');
                setLoading(false);
                return;
            }

            // Validate POC Email and Phone
            for (const poc of validPOCs) {
                if (!validateEmail(poc.email)) {
                    toast.error(`Invalid email for POC ${poc.name}`);
                    setLoading(false);
                    return;
                }
                if (poc.phone && !validatePhone(poc.phone)) {
                    toast.error(`Invalid phone number for POC ${poc.name} (must be 10-15 digits)`);
                    setLoading(false);
                    return;
                }
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 sm:p-10 border-b bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            {initialData ? 'Update Partner Profile' : 'Register New Partner'}
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Partner onboarding portal</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm sm:shadow-none border border-transparent hover:border-slate-100 group"
                    >
                        <X size={24} className="text-slate-400 group-hover:text-slate-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-10 overflow-y-auto flex-1 custom-scrollbar space-y-12">
                    {/* Logo Upload Section */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Brand Identity
                        </h3>
                        <div className="flex flex-col sm:flex-row items-center gap-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                            {logoPreview ? (
                                <div className="relative group">
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white">
                                        <img
                                            src={logoPreview.startsWith('http') || logoPreview.startsWith('data:') ? logoPreview : getImageUrl(logoPreview)}
                                            alt="Company Logo"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-2xl p-2 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                                    <ImageIcon className="w-8 h-8" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Logo</span>
                                </div>
                            )}
                            <div className="text-center sm:text-left space-y-3">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
                                    <Upload className="w-4 h-4" />
                                    {logoPreview ? 'Update Logo' : 'Choose Logo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Format: JPG, PNG, GIF • Max: 5MB</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            General Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 bg-slate-50/30 p-6 sm:p-8 rounded-[2rem] border border-slate-100">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Industry</label>
                                <input
                                    type="text"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                                    placeholder="e.g. Fintech"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Website URL *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.websiteUrl}
                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">LinkedIn URL</label>
                                <input
                                    type="url"
                                    value={formData.linkedinUrl}
                                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                                    placeholder="https://linkedin.com/company/..."
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Company Overview</label>
                                <textarea
                                    value={formData.companyInfo}
                                    onChange={(e) => setFormData({ ...formData, companyInfo: e.target.value })}
                                    rows={4}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700 resize-none"
                                    placeholder="Tell us about the partner..."
                                />
                            </div>

                            {(user?.isAdmin || user?.designation === 'Admin' || user?.designation === 'Manager' || user?.designation === 'Mentor') && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Lead Executive</label>
                                        <select
                                            value={formData.bdExecutive}
                                            onChange={(e) => {
                                                const selectedName = e.target.value;
                                                const selectedBD = bdExecutives.find(bd => bd.name === selectedName);
                                                setFormData({
                                                    ...formData,
                                                    bdExecutive: selectedName,
                                                    bdExecutiveEmail: selectedBD?.email || '',
                                                    bdExecutivePhone: selectedBD?.phone || ''
                                                });
                                            }}
                                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                                        >
                                            <option value="">Choose Executive</option>
                                            {bdExecutives.map((bd) => (
                                                <option key={bd._id} value={bd.name}>{bd.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Requirement volume</label>
                                        <input
                                            type="number"
                                            value={formData.noOfRequirements}
                                            onChange={(e) => setFormData({ ...formData, noOfRequirements: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                                            placeholder="e.g. 10"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="sm:col-span-2 border-t border-slate-100 pt-8 mt-4">
                                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 px-1">Contract details</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Payout structure</label>
                                        <select
                                            value={formData.payoutOption}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                payoutOption: e.target.value as any,
                                                agreementPercentage: e.target.value === 'Flat Pay' ? '' : formData.agreementPercentage,
                                                flatPayAmount: e.target.value === 'Agreement Percentage' ? '' : formData.flatPayAmount
                                            })}
                                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                                        >
                                            <option value="Agreement Percentage">Commission %</option>
                                            <option value="Flat Pay">Fixed Fee</option>
                                            <option value="Both">Hybrid</option>
                                        </select>
                                    </div>

                                    {(formData.payoutOption === 'Agreement Percentage' || formData.payoutOption === 'Both') && (
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Fee %</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.agreementPercentage}
                                                onChange={(e) => setFormData({ ...formData, agreementPercentage: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                                                placeholder="8.33"
                                            />
                                        </div>
                                    )}

                                    {(formData.payoutOption === 'Flat Pay' || formData.payoutOption === 'Both') && (
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Fixed Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.flatPayAmount}
                                                onChange={(e) => setFormData({ ...formData, flatPayAmount: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                                                placeholder="50,000"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {(user?.isAdmin || user?.designation === 'Admin' || user?.designation === 'Finance') && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    Billing & Logistics
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setFormData({
                                        ...formData,
                                        billingDetails: [...(formData.billingDetails || []), { address: '', state: '', gstNumber: '' }]
                                    })}
                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100"
                                >
                                    + Add Site
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(formData.billingDetails || []).map((detail, index) => (
                                    <div key={index} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 relative group">
                                        {(formData.billingDetails || []).length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    billingDetails: (formData.billingDetails || []).filter((_, i) => i !== index)
                                                })}
                                                className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Site Address</label>
                                                <textarea
                                                    value={detail.address}
                                                    onChange={(e) => {
                                                        const newDetails = [...(formData.billingDetails || [])];
                                                        newDetails[index] = { ...newDetails[index], address: e.target.value };
                                                        setFormData({ ...formData, billingDetails: newDetails });
                                                    }}
                                                    rows={2}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700 resize-none"
                                                    placeholder="Physical address"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">GST Number</label>
                                                    <input
                                                        type="text"
                                                        value={detail.gstNumber}
                                                        onChange={(e) => {
                                                            const newDetails = [...(formData.billingDetails || [])];
                                                            newDetails[index] = { ...newDetails[index], gstNumber: e.target.value };
                                                            setFormData({ ...formData, billingDetails: newDetails });
                                                        }}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700"
                                                        placeholder="GSTIN"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">State</label>
                                                    <input
                                                        type="text"
                                                        value={detail.state}
                                                        onChange={(e) => {
                                                            const newDetails = [...(formData.billingDetails || [])];
                                                            newDetails[index] = { ...newDetails[index], state: e.target.value };
                                                            setFormData({ ...formData, billingDetails: newDetails });
                                                        }}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700"
                                                        placeholder="Region"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* POC Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Stakeholder Directory
                            </h3>
                            <button
                                type="button"
                                onClick={addPOC}
                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
                            >
                                + Add Contact
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(formData.pocs || []).map((poc, index) => (
                                <div key={index} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 relative group">
                                    {(formData.pocs || []).length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removePOC(index)}
                                            className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all font-bold"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Full Name *</label>
                                            <input
                                                type="text"
                                                value={poc.name}
                                                onChange={(e) => handlePOCChange(index, 'name', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700"
                                                placeholder="Stakeholder Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Work Email *</label>
                                            <input
                                                type="email"
                                                value={poc.email}
                                                onChange={(e) => handlePOCChange(index, 'email', e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700"
                                                placeholder="name@company.com"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Phone</label>
                                                <input
                                                    type="tel"
                                                    value={poc.phone}
                                                    onChange={(e) => handlePOCChange(index, 'phone', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700"
                                                    placeholder="Primary contact"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">LinkedIn</label>
                                                <input
                                                    type="url"
                                                    value={poc.linkedinUrl}
                                                    onChange={(e) => handlePOCChange(index, 'linkedinUrl', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700"
                                                    placeholder="Profile URL"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t bg-slate-50/30 -mx-6 sm:-mx-10 px-6 sm:px-10 pb-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-center"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 active:scale-95 text-center"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </div>
                            ) : (initialData ? 'Update Profile' : 'Authorize Partner')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
