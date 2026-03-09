import { useState } from "react";
import { X, MessageSquare, Send, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { toast } from "react-toastify";

interface Comment {
    _id?: string;
    text: string;
    author?: { name: string; designation?: string };
    timestamp?: string;
}

interface CommentModalProps {
    candidateId: string;
    candidateName: string;
    existingComments?: Comment[];
    onClose: () => void;
    onCommentAdded?: (updatedCandidate: any) => void;
}

export const CommentModal = ({
    candidateId,
    candidateName,
    existingComments = [],
    onClose,
    onCommentAdded,
}: CommentModalProps) => {
    const { user } = useAuth();
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [comments, setComments] = useState<Comment[]>(existingComments);

    const handleSubmit = async () => {
        if (!commentText.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/candidates/${candidateId}/comments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: commentText.trim(), authorId: user?._id }),
                }
            );
            const data = await res.json();
            if (data.success) {
                toast.success("Comment added successfully");
                setComments(data.candidate.comments || []);
                setCommentText("");
                if (onCommentAdded) onCommentAdded(data.candidate);
            } else {
                toast.error("Failed to add comment");
            }
        } catch (err) {
            toast.error("Error adding comment");
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (ts?: string) => {
        if (!ts) return "";
        const d = new Date(ts);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-xl">
                            <MessageSquare className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-base">Comments</h3>
                            <p className="text-xs text-gray-400 font-medium truncate max-w-[220px]">{candidateName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
                    {comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                            <p className="text-sm font-medium">No comments yet</p>
                            <p className="text-xs mt-1">Be the first to add a comment</p>
                        </div>
                    ) : (
                        [...comments].reverse().map((comment, idx) => (
                            <div
                                key={comment._id || idx}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                                            {comment.author?.name?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-700">
                                                {comment.author?.name || "Unknown"}
                                            </p>
                                            {comment.author?.designation && (
                                                <p className="text-[10px] text-gray-400">{comment.author.designation}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        {formatTime(comment.timestamp)}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-gray-100 flex-shrink-0">
                    <div className="flex gap-2 items-end">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            rows={2}
                            placeholder="Write a comment... (Press Enter to submit)"
                            className="flex-1 resize-none px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !commentText.trim()}
                            className="flex-shrink-0 p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
