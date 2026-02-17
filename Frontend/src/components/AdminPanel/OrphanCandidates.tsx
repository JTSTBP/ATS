import { useState, useEffect, useMemo, useRef } from "react";
import { Search, UserX, Phone, Mail, Calendar, ArrowLeft, Edit, X, ChevronDown, Check, Loader2, CheckSquare, Square, Trash2, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserContext } from "../../context/UserProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/dateUtils";
import { toast } from "react-toastify";

// 🔹 Searchable Select Component (Reused from UserManagement pattern)
const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder,
    className = "",
    disabled = false
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
    disabled?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full p-3 bg-white border border-slate-200 rounded-xl text-sm flex justify-between items-center focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    }`}
            >
                <span className={`text-sm ${selectedOption && selectedOption.value !== '' ? "text-slate-800 font-semibold" : "text-slate-500 font-medium"}`}>
                    {selectedOption && selectedOption.value !== '' ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-[110] mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-hidden flex flex-col"
                    >
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Filter users..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 bg-white font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto py-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(opt => (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearchTerm("");
                                        }}
                                        className={`px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm transition-colors flex items-center justify-between ${value === opt.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 font-medium'
                                            }`}
                                    >
                                        {opt.label}
                                        {value === opt.value && <Check size={14} className="text-indigo-600" />}
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-slate-400 text-xs italic font-medium">No team members found</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function OrphanCandidates() {
    const { users, fetchUsers } = useUserContext();
    const { candidates, fetchallCandidates, updateCandidate, loading: candidatesLoading } = useCandidateContext();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Reassignment Modal State
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [selectedCandidatesToReassign, setSelectedCandidatesToReassign] = useState<any[]>([]);
    const [newCreatorId, setNewCreatorId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        fetchUsers();
        fetchallCandidates();
    }, []);

    const orphanCandidates = useMemo(() => {
        if (!candidates || !users) return [];

        return candidates.filter(candidate => {
            const creatorId = candidate.createdBy?._id || candidate.createdBy;
            const creatorExists = users.some(user => user._id === creatorId);
            return !creatorExists;
        });
    }, [candidates, users]);

    const filteredOrphans = orphanCandidates.filter(candidate => {
        const name = candidate.dynamicFields?.candidateName || "";
        const email = candidate.dynamicFields?.Email || "";
        const phone = candidate.dynamicFields?.Phone || "";
        const creatorId = typeof candidate.createdBy === 'object' ? candidate.createdBy?._id : candidate.createdBy || "";

        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            phone.includes(searchTerm) ||
            email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            creatorId.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSelectToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredOrphans.map(c => c._id || ""));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSingleReassignClick = (candidate: any) => {
        setSelectedCandidatesToReassign([candidate]);
        setIsReassignModalOpen(true);
        setNewCreatorId("");
        setProgress({ current: 0, total: 0 });
    };

    const handleBulkReassignClick = () => {
        const selected = orphanCandidates.filter(c => selectedIds.includes(c._id || ""));
        setSelectedCandidatesToReassign(selected);
        setIsReassignModalOpen(true);
        setNewCreatorId("");
        setProgress({ current: 0, total: 0 });
    };

    const handleConfirmReassign = async () => {
        if (!newCreatorId) {
            toast.warning("Please select a new team member");
            return;
        }

        setIsSubmitting(true);
        const total = selectedCandidatesToReassign.length;
        setProgress({ current: 0, total });

        let successCount = 0;
        for (let i = 0; i < total; i++) {
            const candidate = selectedCandidatesToReassign[i];
            try {
                const updatedData = {
                    ...candidate,
                    createdBy: newCreatorId
                };
                const res = await updateCandidate(candidate._id, updatedData);
                if (res) successCount++;
            } catch (error) {
                console.error(`Reassignment failed for ${candidate._id}:`, error);
            }
            setProgress(p => ({ ...p, current: i + 1 }));
        }

        if (successCount === total) {
            toast.success(`Successfully reassigned ${total} candidate(s)`);
        } else if (successCount > 0) {
            toast.info(`Successfully reassigned ${successCount}/${total} candidate(s)`);
        }

        setIsReassignModalOpen(false);
        setIsSubmitting(false);
        setSelectedIds([]);
        fetchallCandidates(); // Refresh list
    };

    const userOptions = useMemo(() => {
        return (users || []).map(u => ({
            value: u._id,
            label: `${u.name} (${u.designation})`
        }));
    }, [users]);

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen relative pb-24">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-2 text-sm font-bold uppercase tracking-wider"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        Orphan Candidates <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold">{orphanCandidates.length}</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Candidates whose creator ID does not match any existing user.</p>
                </div>

                <div className="relative group min-w-[300px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, phone or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-600 shadow-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-5 px-6 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        checked={selectedIds.length === filteredOrphans.length && filteredOrphans.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate Info</th>
                                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Details</th>
                                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Created At</th>
                                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Invalid Creator ID</th>
                                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence mode="popLayout">
                                {filteredOrphans.length > 0 ? (
                                    filteredOrphans.map((candidate) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={candidate._id}
                                            className={`hover:bg-slate-50/80 transition-colors group ${selectedIds.includes(candidate._id || '') ? 'bg-indigo-50/30' : ''}`}
                                        >
                                            <td className="py-4 px-6 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    checked={selectedIds.includes(candidate._id || '')}
                                                    onChange={() => handleSelectToggle(candidate._id || '')}
                                                />
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                                                        {(candidate.dynamicFields?.candidateName || '?').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">{candidate.dynamicFields?.candidateName || 'N/A'}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{candidate._id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
                                                        <Phone size={12} className="text-slate-400" />
                                                        {candidate.dynamicFields?.Phone || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
                                                        <Mail size={12} className="text-slate-400" />
                                                        {candidate.dynamicFields?.Email || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {candidate.createdAt ? formatDate(candidate.createdAt) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-mono font-bold border border-red-100">
                                                    {typeof candidate.createdBy === 'object' ? candidate.createdBy?._id : candidate.createdBy}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleSingleReassignClick(candidate)}
                                                    className="p-2.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 rounded-xl transition-all shadow-sm hover:shadow-indigo-200"
                                                    title="Reassign to valid user"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
                                                    <UserX className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 font-bold">No orphan candidates found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] w-full max-w-2xl px-4"
                    >
                        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 backdrop-blur-xl bg-opacity-95">
                            <div className="flex items-center gap-4 pl-4 border-l-2 border-indigo-500">
                                <div className="text-2xl font-black">{selectedIds.length}</div>
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Candidates Selected</div>
                            </div>

                            <div className="flex items-center gap-2 pr-2">
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkReassignClick}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 transform active:scale-95"
                                >
                                    <UserPlus size={18} />
                                    REASSIGN ALL
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reassign Modal */}
            <AnimatePresence>
                {isReassignModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isSubmitting && setIsReassignModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 overflow-visible"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                        {selectedCandidatesToReassign.length > 1 ? 'Bulk Reassign' : 'Reassign Candidate'}
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium mt-1">
                                        {selectedCandidatesToReassign.length > 1
                                            ? `Assign ${selectedCandidatesToReassign.length} candidates to a new team member.`
                                            : 'Assign this candidate to a new team member.'}
                                    </p>
                                </div>
                                <button
                                    disabled={isSubmitting}
                                    onClick={() => setIsReassignModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Progress Bar (Visible during bulk) */}
                                {isSubmitting && progress.total > 1 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Reassigning Flow</span>
                                            <span>{progress.current} / {progress.total}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-indigo-600"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {!isSubmitting && selectedCandidatesToReassign.length === 1 && (
                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-bold text-xl shadow-sm">
                                            {(selectedCandidatesToReassign[0]?.dynamicFields?.candidateName || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 tracking-tight">{selectedCandidatesToReassign[0]?.dynamicFields?.candidateName || 'N/A'}</div>
                                            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{selectedCandidatesToReassign[0]?._id}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Select New Owner</label>
                                    <SearchableSelect
                                        options={userOptions}
                                        value={newCreatorId}
                                        onChange={setNewCreatorId}
                                        placeholder="Search for a team member..."
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting || !newCreatorId}
                                    onClick={handleConfirmReassign}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            {progress.total > 1 ? `PROCESSING ${progress.current}/${progress.total}` : 'REASSIGNING...'}
                                        </>
                                    ) : (
                                        <>
                                            <Check size={20} />
                                            {selectedCandidatesToReassign.length > 1 ? `CONFIRM BULK REASSIGNMENT` : 'CONFIRM REASSIGNMENT'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
