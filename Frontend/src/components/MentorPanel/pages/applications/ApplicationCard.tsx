import { Edit, User, Briefcase, ChevronDown } from "lucide-react";
import { useState } from "react";

import { toast } from "react-toastify";
import { useCandidateContext } from "../../../../context/CandidatesProvider";
import { formatDate } from "../../../../utils/dateUtils";
import { StatusUpdateModal } from "../../../Common/StatusUpdateModal";

export const ApplicationCard = ({
  application,

  user,
}: any) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateStatus, fetchallCandidates } = useCandidateContext();
  const [showNotes, setShowNotes] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  const statuses = [
    "New",
    "Shortlisted",
    "Interviewed",
    "Selected",
    "Joined",
    "Rejected",
  ];
  const toggleNotes = () => setShowNotes(!showNotes);

  const handleStatusChangeClick = (e: any) => {
    setPendingStatusChange(e.target.value);
    setStatusModalOpen(true);
  };

  const confirmStatusChange = async (comment: string) => {
    if (!pendingStatusChange) return;
    setLoading(true);
    const success = await updateStatus(
      application._id,
      pendingStatusChange,
      user?._id,
      undefined,
      undefined,
      undefined,
      comment
    );
    setLoading(false);
    fetchallCandidates();
    success ? toast.success("Status updated") : toast.error("Failed to update");
    setEditing(false);
    setStatusModalOpen(false);
    setPendingStatusChange(null);
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div>
          {/* Candidate */}
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {application.dynamicFields?.candidateName || "Unnamed"}
            </h2>
          </div>
          {/* Job */}
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-600">
              {application.jobId?.title || "Not Assigned"}
            </p>
          </div>
          {/* Client */}
          {application.jobId?.clientId?.companyName && (
            <p className="text-sm text-gray-600 mt-1">
              Client: {application.jobId.clientId.companyName}
            </p>
          )}
        </div>
        {/* Edit Button */}
        <button
          onClick={() => setEditing(!editing)}
          className="p-2 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600 transition"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      {/* Created By */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
          Added by: {application.createdBy?.name || "Unknown"}
        </span>
        {application.createdAt && (
          <span className="text-xs text-gray-500">
            {formatDate(application.createdAt)}
          </span>
        )}
      </div>

      {/* STATUS SECTION */}
      <div className="mt-3">
        {!editing ? (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Status:
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                {application.status}
              </span>
            </span>
            <ChevronDown
              onClick={toggleNotes}
              className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${showNotes ? "rotate-180" : "rotate-0"}`}
            />
          </div>
        ) : (
          <select
            onChange={handleStatusChangeClick}
            defaultValue={application.status}
            disabled={loading}
            className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          >
            {statuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* NOTES */}
      {application.notes && showNotes && (
        <p className="text-xs text-gray-600 mt-3 border-t pt-3 line-clamp-2">
          {application.notes}
        </p>
      )}

      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmStatusChange}
        newStatus={pendingStatusChange || ""}
        candidateName={application.dynamicFields?.candidateName}
      />
    </div>
  );
};
