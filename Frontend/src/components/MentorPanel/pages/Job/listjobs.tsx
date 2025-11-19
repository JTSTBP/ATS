
import React from "react";
import { RefreshCcw, Edit, MoreVertical, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface JobCardProps {
  id?: string | number;
  title: string;
  location?: string;
  tags?: string[];
  totalResponses?: number;
  newResponses?: number;
  shortlisted?: number;
  postedBy?: string;
  postedDate?: string;
  // action handlers (optional)
  onView?: (id?: string | number) => void;
  onEdit?: (id?: string | number) => void;
  onDelete?: (id?: string | number) => void;
  onRefresh?: (id?: string | number) => void;
  // optional more menu handler (for three-dots)
  onMore?: (id?: string | number) => void;
}


const JobCard: React.FC<JobCardProps> = ({
  id,
  title,
  location,
  tags = [],
  totalResponses = 0,
  newResponses = 0,
  shortlisted = 0,
  postedBy = "You",
  postedDate = "N/A",
  onView,
  onEdit,
  onDelete,
  onRefresh,
  onMore,
}) => {
  const navigate = useNavigate();
    const handleTitleClick = () => {
      if (id) {
        navigate(`/Mentor/jobs/${id}/candidates`);
      }
    };
  return (
    <div className="flex items-start justify-between border rounded-xl p-4 shadow-sm bg-white mb-4">
      {/* LEFT SECTION */}
      <div className="flex items-start gap-3">
        <input type="checkbox" className="mt-2" />

        <div>
          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

          {/* Location */}
          <p className="text-sm text-gray-500 mt-1">{location}</p>

          {/* Tags */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION — Responses */}
      <div className="flex gap-8 items-center">
        <div className="text-center" onClick={handleTitleClick}>
          <p className="text-lg font-semibold text-gray-800">
            {totalResponses}
          </p>
          <p className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full inline-block">
            {newResponses} New
          </p>
          <p className="text-xs text-gray-500 mt-1">Total Responses</p>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">{shortlisted}</p>
          <p className="text-xs text-gray-500 mt-1">Shortlisted</p>
        </div>
      </div>

      {/* RIGHT SECTION — actions + posted info aligned top/bottom */}
      <div className="flex flex-col justify-between items-end h-full">
        {/* Top row: action icons (clickable) */}
        <div className="flex gap-3 text-gray-600">
          <button
            aria-label="Refresh"
            onClick={() => onRefresh?.(id)}
            className="p-1 rounded hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCcw className="w-5 h-5 cursor-pointer" />
          </button>

          <button
            aria-label="View"
            onClick={() => onView?.(id)}
            className="p-1 rounded hover:bg-gray-100"
            title="View"
          >
            <Eye className="w-5 h-5 cursor-pointer" />
          </button>

          <button
            aria-label="Edit"
            onClick={() => onEdit?.(id)}
            className="p-1 rounded hover:bg-gray-100 text-blue-600"
            title="Edit"
          >
            <Edit className="w-5 h-5 cursor-pointer" />
          </button>

          <button
            aria-label="Delete"
            onClick={() => onDelete?.(id)}
            className="p-1 rounded hover:bg-red-50 text-red-600"
            title="Delete"
          >
            <Trash2 className="w-5 h-5 cursor-pointer" />
          </button>

          {/* <button
            aria-label="More"
            onClick={() => onMore?.(id)}
            className="p-1 rounded hover:bg-gray-100"
            title="More"
          >
            <MoreVertical className="w-5 h-5 cursor-pointer" />
          </button> */}
        </div>

        {/* Bottom Section */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <span>posted by {postedBy}</span> | <span>{postedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
