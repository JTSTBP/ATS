import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface StatusUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment: string, joiningDate?: string, offerLetter?: File, selectionDate?: string, expectedJoiningDate?: string, rejectedBy?: string, ctc?: string) => void;
    newStatus: string;
    candidateName?: string;
    isCommentOnly?: boolean;
    currentJoiningDate?: string;
    currentSelectionDate?: string;
    currentExpectedJoiningDate?: string;
    currentRejectedBy?: string;
    currentCTC?: string;
    droppedBy?: string; // New prop for auto-determined drop source
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
    droppedBy,
}) => {
    const [comment, setComment] = useState("");
    const [joiningDate, setJoiningDate] = useState("");
    const [offerLetter, setOfferLetter] = useState<File | undefined>(undefined);
    const [selectionDate, setSelectionDate] = useState("");
    const [expectedJoiningDate, setExpectedJoiningDate] = useState("");
    const [rejectedBy, setRejectedBy] = useState("");
    const [ctc, setCtc] = useState("");

    useEffect(() => {
        if (isOpen) {
            setComment("");
            setJoiningDate(currentJoiningDate ? new Date(currentJoiningDate).toISOString().split('T')[0] : "");
            setOfferLetter(undefined);
            setSelectionDate(currentSelectionDate ? new Date(currentSelectionDate).toISOString().split('T')[0] : "");
            setExpectedJoiningDate(currentExpectedJoiningDate ? new Date(currentExpectedJoiningDate).toISOString().split('T')[0] : "");
            setRejectedBy(currentRejectedBy || "");
            setCtc(currentCTC || "");
        }
    }, [isOpen, currentJoiningDate, currentSelectionDate, currentExpectedJoiningDate, currentRejectedBy, currentCTC]);

    if (!isOpen) return null;

    const isJoined = newStatus === "Joined";
    const isSelected = newStatus === "Selected";
    const isDropped = newStatus === "Dropped";
    // const isRejected = newStatus === "Rejected" || newStatus === "Dropped"; 

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-800">
                            {isCommentOnly ? "Add Comment" : (isJoined && currentJoiningDate ? "Update Joining Details" : "Update Status")}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        {!isCommentOnly && (
                            <p className="text-gray-600 mb-4">
                                Changing status {candidateName ? `for ${candidateName}` : ""} to{" "}
                                <span className="font-bold text-orange-600">{newStatus}</span>.
                            </p>
                        )}
                        {!isCommentOnly && isJoined && currentJoiningDate && (
                            <p className="text-gray-600 mb-4">
                                Update joining details {candidateName ? `for ${candidateName}` : ""}.
                            </p>
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
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setOfferLetter(e.target.files?.[0])}
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

                        {newStatus === "Rejected" && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rejected By <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="rejectedBy"
                                            value="Client"
                                            checked={rejectedBy === "Client"}
                                            onChange={(e) => setRejectedBy(e.target.value)}
                                            className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-orange-600 transition-colors">Client</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="rejectedBy"
                                            value="Mentor"
                                            checked={rejectedBy === "Mentor"}
                                            onChange={(e) => setRejectedBy(e.target.value)}
                                            className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-orange-600 transition-colors">Mentor</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {isDropped && droppedBy && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-sm text-red-700 font-medium">
                                    This candidate will be marked as <span className="font-bold">Dropped by {droppedBy}</span>.
                                </p>
                            </div>
                        )}

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isDropped ? "Reason for Drop" : "Add a Comment (Optional)"} {isDropped && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                            rows={4}
                            placeholder={isDropped ? "Please explain why the candidate was dropped..." : "Enter reason or notes for this status change..."}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
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
                                    onConfirm(comment, joiningDate, offerLetter, selectionDate, expectedJoiningDate, isDropped ? droppedBy : rejectedBy, ctc);
                                }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors shadow-sm"
                            >
                                {isDropped ? "Confirm Drop" : "Confirm Update"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
