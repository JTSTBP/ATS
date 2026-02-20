import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface StatusUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment: string, joiningDate?: string, offerLetter?: File, selectionDate?: string, expectedJoiningDate?: string, rejectedBy?: string, ctc?: string, rejectionReason?: string, stageNameForHistory?: string, stageStatus?: string, stageNotes?: string) => void;
    newStatus: string;
    candidateName?: string;
    isCommentOnly?: boolean;
    currentJoiningDate?: string;
    currentSelectionDate?: string;
    currentExpectedJoiningDate?: string;
    currentRejectedBy?: string;
    currentCTC?: string;
    droppedBy?: string;
    isLoading?: boolean;
    stageNameForHistory?: string;
    nextStageName?: string;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    newStatus,
    candidateName,
    isCommentOnly = false,
    currentJoiningDate,
    currentSelectionDate,
    currentExpectedJoiningDate,
    currentRejectedBy,
    currentCTC,
    isLoading = false,
    stageNameForHistory,
    nextStageName,
    droppedBy: propDroppedBy,
}) => {
    const [comment, setComment] = useState("");
    const [joiningDate, setJoiningDate] = useState("");
    const [offerLetter, setOfferLetter] = useState<File | undefined>(undefined);
    const [selectionDate, setSelectionDate] = useState("");
    const [expectedJoiningDate, setExpectedJoiningDate] = useState("");
    const [rejectedBy, setRejectedBy] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [droppedBy, setDroppedBy] = useState("");
    const [ctc, setCtc] = useState("");

    // Interview Stage Specific State
    const [stageStatus, setStageStatus] = useState("Selected"); // Default to Selected for moving to next stage
    const [stageNotes, setStageNotes] = useState("");

    useEffect(() => {
        if (isOpen) {
            setComment("");
            setJoiningDate(currentJoiningDate ? new Date(currentJoiningDate).toISOString().split('T')[0] : "");
            setOfferLetter(undefined);
            setSelectionDate(currentSelectionDate ? new Date(currentSelectionDate).toISOString().split('T')[0] : "");
            setExpectedJoiningDate(currentExpectedJoiningDate ? new Date(currentExpectedJoiningDate).toISOString().split('T')[0] : "");
            setRejectedBy(currentRejectedBy || "");
            setDroppedBy(propDroppedBy || "");
            setRejectionReason("");
            setCtc(currentCTC || "");
            setStageStatus("Selected");
            setStageNotes("");
        }
    }, [isOpen, currentJoiningDate, currentSelectionDate, currentExpectedJoiningDate, currentRejectedBy, propDroppedBy, currentCTC]);

    const isJoined = newStatus === "Joined";
    const isSelected = newStatus === "Selected";
    const isDropped = newStatus === "Dropped";
    const isInterviewUpdate = !!stageNameForHistory; // True if we are completing a stage
    const isRejected = newStatus === "Rejected" || (isInterviewUpdate && stageStatus === "Rejected");

    // Role detection logic
    const effectiveRejectedBy = (isInterviewUpdate && stageStatus === "Rejected") ? "Client" : rejectedBy;
    const effectiveDroppedBy = (isInterviewUpdate && newStatus === "Dropped") ? "Client" : droppedBy;

    if (!isOpen) return null;

    const rejectionReasons = [
        "Lacks Technical Skills",
        "Salary Mismatch",
        "Communication Skills",
        "Experience Level",
        "Culture Fit",
        "Found Better Candidate",
        "Notice Period Issues",
        "Not Interested",
        "Other"
    ];

    const getModalTitle = () => {
        if (isCommentOnly) return "Add Comment";
        if (isJoined && currentJoiningDate) return "Update Joining Details";
        if (isInterviewUpdate) return `Move to ${nextStageName || "Next Stage"}`;
        if (newStatus === "Rejected" || (isInterviewUpdate && stageStatus === "Rejected")) return "Candidate Rejection";
        return "Update Status";
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                        <h3 className="text-lg font-bold text-gray-800">
                            {getModalTitle()}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        {!isCommentOnly && !isInterviewUpdate && (
                            <p className="text-gray-600 mb-4">
                                Changing status {candidateName ? `for ${candidateName}` : ""} to{" "}
                                <span className="font-bold text-orange-600">{newStatus}</span>.
                            </p>
                        )}
                        {!isCommentOnly && isInterviewUpdate && (
                            <p className="text-gray-600 mb-4">
                                Completing <span className="font-bold">{stageNameForHistory}</span> and moving to <span className="font-bold text-orange-600">{nextStageName || "Next Stage"}</span>.
                            </p>
                        )}
                        {!isCommentOnly && isJoined && currentJoiningDate && (
                            <p className="text-gray-600 mb-4">
                                Update joining details {candidateName ? `for ${candidateName}` : ""}.
                            </p>
                        )}

                        {/* Interview Stage Completion Details */}
                        {isInterviewUpdate && (
                            <div className="mb-4 space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <h4 className="font-semibold text-gray-800 text-sm">
                                    {stageNameForHistory} Details
                                </h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                        value={stageStatus}
                                        onChange={(e) => setStageStatus(e.target.value)}
                                    >
                                        <option value="Selected">Selected</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>
                                {stageStatus !== "Rejected" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stage Notes/Feedback
                                        </label>
                                        <textarea
                                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                                            rows={2}
                                            placeholder="Enter feedback for this stage..."
                                            value={stageNotes}
                                            onChange={(e) => setStageNotes(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {isSelected && (
                            <div className="mb-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Selection Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                        value={selectionDate}
                                        onChange={(e) => setSelectionDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expected Joining Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                        value={expectedJoiningDate}
                                        onChange={(e) => setExpectedJoiningDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {isJoined && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Joining Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                    value={joiningDate}
                                    onChange={(e) => setJoiningDate(e.target.value)}
                                />
                                <label className="block text-sm font-medium text-gray-700 mt-3 mb-2">
                                    Offer Letter (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const fileExtension = file.name.split('.').pop()?.toLowerCase();
                                        const allowedExtensions = ['pdf', 'doc', 'docx'];

                                        if (!allowedExtensions.includes(fileExtension || "")) {
                                            alert('Only PDF and Word documents (.doc, .docx) are allowed.');
                                            e.target.value = ''; // Clear the input
                                            return;
                                        }

                                        setOfferLetter(file);
                                    }}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                />
                            </div>
                        )}

                        {(isSelected || isJoined) && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Offered CTC {isJoined && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="number"
                                    required={isJoined}
                                    placeholder={`Enter CTC ${isSelected ? '(Optional)' : '(e.g. 500000)'}`}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                    value={ctc}
                                    onChange={(e) => setCtc(e.target.value)}
                                />
                            </div>
                        )}

                        {isRejected && (
                            <div className="mb-4 space-y-4 p-4 bg-red-50 rounded-lg border border-red-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejected By
                                    </label>
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                                        {effectiveRejectedBy || "Not set"}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all scrollbar-hide"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    >
                                        <option value="">Select a reason</option>
                                        {rejectionReasons.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {isDropped && (
                            <div className="mb-4 space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Dropped By
                                    </label>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium">
                                        {effectiveDroppedBy || "Not set"}
                                    </div>
                                </div>
                            </div>
                        )}

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isRejected ? "Rejection Notes" : (isDropped ? "Reason for Drop" : "Add a Comment (Optional)")} {(isDropped || isRejected) && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                            rows={3}
                            placeholder={isRejected ? "Add any details about the rejection..." : (isDropped ? "Please explain why the candidate was dropped..." : "Enter reason or notes for this status change...")}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isLoading}
                            onClick={() => {
                                if (isJoined && !joiningDate) {
                                    alert("Please select a joining date");
                                    return;
                                }
                                if (isSelected && !selectionDate) {
                                    alert("Please select a selection date");
                                    return;
                                }
                                if (isJoined && !ctc) {
                                    alert("Please enter the offered CTC");
                                    return;
                                }
                                if (newStatus === "Rejected" && !rejectedBy) {
                                    alert("Please select who rejected the candidate");
                                    return;
                                }
                                if (isDropped && !comment) {
                                    alert("Please provide a reason for dropping the candidate");
                                    return;
                                }
                                if (isRejected && !rejectionReason) {
                                    alert("Please enter a rejection reason");
                                    return;
                                }
                                if (isRejected && !comment) {
                                    alert("Please provide rejection notes");
                                    return;
                                }

                                // Pass additional stage details if applicable
                                onConfirm(
                                    comment,
                                    joiningDate,
                                    offerLetter,
                                    selectionDate,
                                    expectedJoiningDate,
                                    (isDropped || (isInterviewUpdate && stageStatus === "Rejected")) ? "Client" : effectiveRejectedBy, // Default to Client for Interview Rejection
                                    ctc,
                                    rejectionReason,
                                    isInterviewUpdate ? stageNameForHistory : undefined, // Pass stage name for history
                                    isInterviewUpdate ? stageStatus : undefined,
                                    isInterviewUpdate ? stageStatus === "Rejected" ? comment : stageNotes : undefined // Use comment as stage notes for rejection
                                );
                            }}
                            className={`px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors shadow-sm flex items-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                            {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {isLoading ? "Updating..." : (isDropped ? "Confirm Drop" : (isRejected ? "Confirm Rejection" : "Confirm Update"))}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
