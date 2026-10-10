import React from "react";

interface Candidate {
  _id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  skills?: string[];
  currentCompany?: string;
  designation?: string;
  experience?: string;
  location?: string;
  noticePeriod?: string;
  sourceType?: string;
  createdAt?: string;
}

interface CandidateCardProps {
  candidate: Candidate;
  onView: () => void;
}

export default function CandidateCard({ candidate, onView }: CandidateCardProps) {
  return (
    <div className="border rounded-lg shadow-lg p-4 bg-white hover:shadow-2xl transition-shadow duration-300">
      <h3 className="font-semibold text-lg mb-2 text-gray-800">
        {candidate.name || "-"}
      </h3>
      <p className="text-sm text-gray-600 mb-1">Experience: {candidate.experience || "-"}</p>
      {candidate.sourceType && (
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
          {candidate.sourceType}
        </span>
      )}
      <p className="text-sm text-gray-600 mb-1">Location: {candidate.location || "-"}</p>
      <p className="text-sm text-gray-600 mb-1">Company: {candidate.currentCompany || "-"}</p>
      <p className="text-sm text-gray-600 mb-1">Designation: {candidate.designation || "-"}</p>
      <p className="text-sm text-gray-600 mb-1">
        Skills: {candidate.skills?.slice(0, 5).join(", ") || "-"}
      </p>
      <p className="text-sm text-gray-600 mb-1">
        Added: {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : "-"}
      </p>
      <button
        className="mt-2 text-blue-600 hover:underline text-sm"
        onClick={onView}
      >
        View Profile
      </button>
    </div>
  );
}
