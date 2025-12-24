
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
    status?: string;
    onStatusChange?: (newStatus: string) => void;
    // action handlers (optional)
    onView?: (id?: string | number) => void;
    onEdit?: (id?: string | number) => void;
    onDelete?: (id?: string | number) => void;
    onRefresh?: (id?: string | number) => void;
    onNavigateToCandidates?: (jobTitle: string) => void;
    onMore?: (id?: string | number) => void;
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
    status,
    onStatusChange,
    onView,
    onEdit,
    onDelete,
    onRefresh,
    onNavigateToCandidates,
    onMore,
}) => {
    const { user } = useAuth(); // Assuming useAuth is available or imported
    const navigate = useNavigate();
    const handleTitleClick = () => {
        if (id) {
            if (onNavigateToCandidates) {
                onNavigateToCandidates(title);
            } else {
                const basePath =
                    user?.designation === "Admin"
                        ? "/Admin"
                        : user?.designation === "Manager"
                            ? "/Manager"
                            : "/Mentor";

                navigate(`${basePath}/jobs/${id}/candidates`);
            }
        }
    };
    return (
        <div className="grid grid-cols-12 gap-4 items-center border rounded-xl p-4 shadow-sm bg-white mb-4">
            {/* LEFT SECTION - col-span-5 */}
            <div className="col-span-5 flex items-start gap-3">
                <input type="checkbox" className="mt-2" />

                {/* Client Logo */}
                <div className="flex-shrink-0 mt-1">
                    {client?.logo ? (
                        <img
                            src={`${import.meta.env.VITE_BACKEND_URL}/${client.logo}`}
                            alt={client.companyName || 'Client'}
                            className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                    )}
                </div>

                <div>
                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

                    {/* Location */}
                    <p className="text-sm text-gray-500 mt-1">{location}</p>
                    {client?.companyName && (
                        <p className="text-sm text-gray-500 mt-1">{client.companyName}</p>
                    )}

                    {/* Tags & Status */}
                    <div className="flex gap-2 mt-2 items-center flex-wrap">
                        {status && (
                            <div className="relative group">
                                <select
                                    value={status}
                                    onChange={(e) => onStatusChange?.(e.target.value)}
                                    className={`appearance-none px-3 py-1 text-[10px] font-bold rounded-full border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${status === 'Open'
                                        ? 'bg-green-100 text-green-700 border-green-200 focus:ring-green-500'
                                        : status === 'Closed'
                                            ? 'bg-red-100 text-red-700 border-red-200 focus:ring-red-500'
                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200 focus:ring-yellow-500'
                                        }`}
                                >
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                    <option value="On Hold">On Hold</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-current opacity-60"></div>
                                </div>
                            </div>
                        )}
                        {tags.map((tag, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* MIDDLE SECTION — Responses - col-span-4 (Centered) */}
            <div className="col-span-4 flex justify-center gap-8 items-center">
                <div
                    className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
                    onClick={handleTitleClick}
                >
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


            {/* RIGHT SECTION — actions + posted info aligned top/bottom - col-span-3 (Right aligned) */}
            <div className="col-span-3 flex flex-col justify-between items-end h-full">
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
                        title="More Options"
                    >
                        <RefreshCcw className="w-5 h-5 cursor-pointer rotate-90" />
                    </button> */}


                </div>

                {/* Bottom Section */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <span>posted by {postedBy}</span> | <span>{postedDate}</span>
                </div>
            </div>
        </div >
    );
};

export default JobCard;
