
import React from "react";
import { RefreshCcw, Edit, Eye, Trash2, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthProvider";

interface JobCardProps {
    id?: string | number;
    title: string;
    location?: string;
    client?: {
        companyName?: string;
        logo?: string;
    };
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
    onStatusChange?: (id: string, status: string) => void;
    positions?: number;
    status?: string;
}


const JobCard: React.FC<JobCardProps> = ({
    id,
    title,
    location,
    client,
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
    onStatusChange,
    positions,
    status,
}) => {
    const { user } = useAuth(); // Assuming useAuth is available or imported
    const navigate = useNavigate();
    const handleTitleClick = (status?: string) => {
        if (id) {
            const basePath =
                user?.designation === "Admin"
                    ? "/Admin"
                    : user?.designation === "Manager"
                        ? "/Manager"
                        : "/Mentor";

            navigate(`${basePath}/jobs/${id}/candidates`, { state: { status } });
        }
    };
    return (
        <div className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center border rounded-xl p-4 shadow-sm bg-white mb-4 transition-all hover:shadow-md">
            {/* LEFT SECTION - Job Title & Client info */}
            <div className="w-full md:col-span-5 flex items-start gap-3">
                <input type="checkbox" className="mt-2.5 flex-shrink-0" />

                {/* Client Logo */}
                <div className="flex-shrink-0 mt-1">
                    {client?.logo ? (
                        <img
                            src={`${import.meta.env.VITE_BACKEND_URL}/${client.logo}`}
                            alt={client.companyName || 'Client'}
                            className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg border-2 border-gray-100"
                        />
                    ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border border-blue-50">
                            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    {/* Title */}
                    <h2
                        className="text-base md:text-lg font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition truncate"
                        onClick={() => handleTitleClick()}
                        title={title}
                    >
                        {title}
                    </h2>

                    {/* Location & Company */}
                    <div className="flex flex-col mt-0.5">
                        {client?.companyName && (
                            <p className="text-sm font-medium text-gray-700">{client.companyName}</p>
                        )}
                        <p className="text-xs text-gray-500">{location}</p>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                        {tags.map((tag, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 text-[10px] md:text-xs rounded-full bg-purple-50 text-purple-600 border border-purple-100"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* MIDDLE SECTION — Stats - Stacks on mobile, centered grid on desktop */}
            <div className="w-full md:col-span-4 flex flex-wrap justify-between md:justify-center gap-4 md:gap-8 items-center py-4 md:py-0 border-y md:border-none border-gray-50">
                <div
                    className="flex flex-col items-center cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition"
                    onClick={() => handleTitleClick("all")}
                >
                    <p className="text-base md:text-lg font-bold text-gray-900">
                        {totalResponses}
                    </p>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                            {newResponses} New
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Total</p>
                    </div>
                </div>

                <div
                    className="flex flex-col items-center cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition"
                    onClick={() => handleTitleClick("Shortlisted")}
                >
                    <p className="text-base md:text-lg font-bold text-gray-900">{shortlisted}</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Shortlisted</p>
                </div>


                {positions !== undefined && positions > 0 && (
                    <div className="flex flex-col items-center">
                        <p className="text-base md:text-lg font-bold text-gray-900">{positions}</p>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Positions</p>
                    </div>
                )}

                {/* Status Dropdown */}
                <div className="flex flex-col items-center">
                    <select
                        value={status}
                        onChange={(e) => onStatusChange?.(id as string, e.target.value)}
                        className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all cursor-pointer ${status === "Open"
                            ? "bg-green-50 text-green-700 border-green-200 focus:ring-green-500"
                            : status === "Closed"
                                ? "bg-red-50 text-red-700 border-red-200 focus:ring-red-500"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500"
                            }`}
                    >
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Status</p>
                </div>
            </div>


            {/* RIGHT SECTION — Actions & Meta - Space between on mobile, vertical stack on desktop */}
            <div className="w-full md:col-span-3 flex flex-row md:flex-col justify-between items-center md:items-end gap-3">
                {/* Top row: action icons */}
                <div className="flex gap-2 text-gray-500 bg-gray-50 md:bg-transparent p-1 md:p-0 rounded-lg">
                    <button
                        aria-label="Refresh"
                        onClick={() => onRefresh?.(id)}
                        className="p-1.5 rounded-lg hover:bg-white md:hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCcw className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <button
                        aria-label="View"
                        onClick={() => onView?.(id)}
                        className="p-1.5 rounded-lg hover:bg-white md:hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        title="View"
                    >
                        <Eye className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <button
                        aria-label="Edit"
                        onClick={() => onEdit?.(id)}
                        className="p-1.5 rounded-lg hover:bg-white md:hover:bg-gray-100 text-blue-500 transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <button
                        aria-label="Delete"
                        onClick={() => onDelete?.(id)}
                        className="p-1.5 rounded-lg hover:bg-white md:hover:bg-red-50 text-red-500 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Posted date info */}
                <div className="flex flex-col items-end">
                    <p className="text-[10px] text-gray-400 font-medium">
                        Posted {postedDate}
                    </p>
                    <p className="text-[10px] text-gray-500 font-semibold">
                        by {postedBy === "You" ? "me" : postedBy}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JobCard;
