import { useState, useEffect } from "react";
import { Plus, X, Search, Edit, Trash, Check, Shield, Briefcase, User as UserIcon, Users, Phone, Mail, Calendar, Eye, EyeOff, Banknote, ChevronDown, UserX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserContext } from "../../context/UserProvider";
import { useSearchParams, useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/dateUtils";

// 🔹 Searchable Select Component
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
  const myRef = useState(() => ({ current: null as HTMLDivElement | null }))[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (myRef.current && !myRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [myRef]);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={myRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm flex justify-between items-center focus:ring-2 focus:ring-blue-500/20 transition-all ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
      >
        <span className={`text-sm ${selectedOption && selectedOption.value !== '' ? "text-slate-800 font-medium" : "text-slate-500"}`}>
          {selectedOption && selectedOption.value !== '' ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in animate-slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${value === opt.value ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-700'}`}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic">No matching results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser, paginatedUsers, pagination, fetchPaginatedUsers, toggleUserStatus } = useUserContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [reporterFilter, setReporterFilter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleFilter = searchParams.get("role");
  const adminFilter = searchParams.get("isAdmin");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    password: "",
    appPassword: "",
    reporter: "",
    isAdmin: false,
    isDisabled: false,
    personalEmail: "",
    phoneNumber: {
      personal: "",
      official: "",
    },
    dateOfJoining: "",
    dateOfBirth: "",
  });

  // Fetch users when params change
  useEffect(() => {
    // Debounce search slightly if needed, or just pass directly
    const timer = setTimeout(() => {
      fetchPaginatedUsers(
        currentPage,
        limit,
        searchTerm,
        roleFilter || "",
        adminFilter || "",
        reporterFilter
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, roleFilter, adminFilter, reporterFilter]);

  // Reset to page 1 when filters change (but not when page changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, adminFilter, reporterFilter]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      designation: "",
      password: "",
      appPassword: "",
      reporter: "",
      isAdmin: false,
      isDisabled: false,
      personalEmail: "",
      phoneNumber: {
        personal: "",
        official: "",
      },
      dateOfJoining: "",
      dateOfBirth: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    if (name.startsWith("phone_")) {
      const phoneType = name.split("_")[1];
      setFormData({
        ...formData,
        phoneNumber: {
          ...formData.phoneNumber,
          [phoneType]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editUserId) {
        const success = await updateUser(editUserId, formData);
        if (success) {
          setShowModal(false);
          setEditUserId(null);
          resetForm();
          fetchPaginatedUsers(currentPage, limit, searchTerm, roleFilter || "", adminFilter || "", reporterFilter);
        }
      } else {
        const success = await addUser(formData);
        if (success) {
          setShowModal(false);
          resetForm();
          fetchPaginatedUsers(currentPage, limit, searchTerm, roleFilter || "", adminFilter || "", reporterFilter);
        }
      }
    } catch (err) {
      console.error("Error while saving user:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      name: user.name,
      email: user.email,
      designation: user.designation,
      password: "",
      appPassword: user.appPassword || "",
      reporter: typeof user.reporter === 'object' && user.reporter !== null ? user.reporter._id : (user.reporter || ""),
      isAdmin: user.isAdmin,
      isDisabled: user.isDisabled || false,
      personalEmail: user.personalEmail || "",
      phoneNumber: {
        personal: user.phoneNumber?.personal || "",
        official: user.phoneNumber?.official || "",
      },
      dateOfJoining: (user.dateOfJoining || user.joinDate) ? new Date(user.dateOfJoining || user.joinDate).toISOString().split('T')[0] : "",
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    });
    setEditUserId(user._id);
    setShowModal(true);
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchTerm("");
    setReporterFilter("");
  };

  // Helper to determine permissions based on role (Visual only)
  const getPermissions = (role: string, isAdmin: boolean) => {
    const r = role.toLowerCase();
    return {
      jobPosting: r === "admin" || r === "recruiter" || r === "manager",
      candidateAccess: true,
      userManagement: isAdmin || r === "admin",
    };
  };
  console.log(users, "users")

  // Helper for role styling
  const getRoleStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return "bg-violet-100 text-violet-700 border-violet-200";
      case "recruiter": return "bg-blue-100 text-blue-700 border-blue-200";
      case "manager": return "bg-amber-100 text-amber-700 border-amber-200";
      case "mentor": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "finance": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return <Shield size={12} className="mr-1" />;
      case "recruiter": return <Users size={12} className="mr-1" />;
      case "manager": return <Briefcase size={12} className="mr-1" />;
      case "finance": return <Banknote size={12} className="mr-1" />;
      default: return <UserIcon size={12} className="mr-1" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
      {/* Top Bar with Gradient */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Team Members</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Manage your team's access and permissions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group flex-1 md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <SearchableSelect
              options={[
                { value: "", label: "All Reporters" },
                ...Array.from(
                  new Map(
                    users
                      .map((u: any) => u.reporter)
                      .filter(Boolean)
                      .map((r: any) => [r._id, r])
                  ).values()
                ).map((r: any) => ({
                  value: r._id,
                  label: r.name
                }))
              ]}
              value={reporterFilter}
              onChange={(val) => setReporterFilter(val)}
              placeholder="Filter by Reporter"
            />
          </div>

          <div className="flex items-center gap-2 order-first sm:order-last">
            {/* <button
              onClick={() => navigate("/Admin/orphan-candidates")}
              className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
              title="View candidates with invalid creator IDs"
            >
              <UserX size={18} />
              <span className="hidden xl:inline">Orphans</span>
            </button> */}
            <button
              onClick={() => {
                setEditUserId(null);
                resetForm();
                setShowModal(true);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Add Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
              <th className="px-4 sm:px-6 py-4 w-[35%] whitespace-nowrap">User</th>
              <th className="px-4 sm:px-6 py-4 w-[25%] whitespace-nowrap">Role</th>
              <th className="px-4 sm:px-6 py-4 w-[25%] whitespace-nowrap">Reporter</th>
              <th className="px-4 sm:px-6 py-4 text-center w-[20%] whitespace-nowrap">Status</th>
              <th className="px-4 sm:px-6 py-4 text-right w-[20%] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence mode="wait">
              {paginatedUsers.map((user, index) => {
                return (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md transform group-hover:scale-105 transition-transform ${user.isAdmin
                          ? "bg-gradient-to-br from-violet-500 to-purple-600"
                          : "bg-gradient-to-br from-blue-500 to-indigo-600"
                          }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors cursor-pointer hover:underline truncate"
                            onClick={() => handleViewDetails(user)}
                          >
                            {user.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border w-fit ${getRoleStyle(user.designation)}`}>
                          {getRoleIcon(user.designation)}
                          {user.designation}
                        </span>
                        {user.isAdmin && (
                          <span className="inline-flex items-center gap-1 text-xs text-violet-600 font-medium ml-1">
                            <Shield size={10} /> Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      {user.reporter ? (
                        <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span className="hidden sm:inline">{user.reporter.name}</span>
                          <span className="sm:hidden">Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span className="hidden sm:inline">No Reporter</span>
                          <span className="sm:hidden">No</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 sm:px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border ${user.isDisabled
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isDisabled ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                        {user.isDisabled ? "Disabled" : "Active"}
                      </span>
                    </td>

                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform sm:translate-x-2 sm:group-hover:translate-x-0">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user._id)}
                          className={`p-2 rounded-lg transition-colors ${user.isDisabled
                            ? "text-emerald-500 hover:bg-emerald-50"
                            : "text-rose-500 hover:bg-rose-50"
                            }`}
                          title={user.isDisabled ? "Enable User" : "Disable User"}
                        >
                          {user.isDisabled ? <Check size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-3 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
        <div className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
          Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.totalUsers)} of {pagination.totalUsers} users
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">

            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {paginatedUsers.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-300" />
          </div>
          <h3 className="text-slate-800 font-medium">No users found</h3>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* User Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedUser && (
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDetailsModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg ${selectedUser.isAdmin
                    ? "bg-gradient-to-br from-violet-500 to-purple-600"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    }`}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedUser.name}</h2>
                    <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Role & Access */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Role & Access</h3>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getRoleStyle(selectedUser.designation)}`}>
                      {getRoleIcon(selectedUser.designation)}
                      {selectedUser.designation}
                    </span>
                    {selectedUser.isAdmin && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                        <Shield size={14} /> Admin Access
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Mail size={18} className="text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Official Email</p>
                        <p className="text-sm text-slate-800 font-semibold">{selectedUser.email}</p>
                      </div>
                    </div>
                    {selectedUser.personalEmail && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Mail size={18} className="text-green-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Personal Email</p>
                          <p className="text-sm text-slate-800 font-semibold">{selectedUser.personalEmail}</p>
                        </div>
                      </div>
                    )}
                    {selectedUser.phoneNumber?.official && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Phone size={18} className="text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Official Phone</p>
                          <p className="text-sm text-slate-800 font-semibold">{selectedUser.phoneNumber.official}</p>
                        </div>
                      </div>
                    )}
                    {selectedUser.phoneNumber?.personal && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Phone size={18} className="text-green-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Personal Phone</p>
                          <p className="text-sm text-slate-800 font-semibold">{selectedUser.phoneNumber.personal}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Important Dates */}
                {(selectedUser.dateOfJoining || selectedUser.dateOfBirth) && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Important Dates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.dateOfJoining && (
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <Briefcase size={18} className="text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Date of Joining</p>
                            <p className="text-sm text-slate-800 font-semibold">
                              {formatDate(selectedUser.dateOfJoining)}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedUser.dateOfBirth && (
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <Calendar size={18} className="text-purple-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Date of Birth</p>
                            <p className="text-sm text-slate-800 font-semibold">
                              {formatDate(selectedUser.dateOfBirth)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEdit(selectedUser);
                    }}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Edit User
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editUserId ? "Edit User Details" : "Add New Member"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enter the details below</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Basic Information</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g. Sarah Wilson"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Official Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="sarah@company.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Role</label>
                        <div className="relative">
                          <select
                            name="designation"
                            required
                            value={formData.designation}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                          >
                            <option value="">Select...</option>
                            <option value="Admin">Admin</option>
                            <option value="Mentor">Mentor</option>
                            <option value="Recruiter">Recruiter</option>
                            <option value="Manager">Manager</option>
                            <option value="Finance">Finance</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Briefcase size={14} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Reporter</label>
                        <div className="relative">
                          <select
                            name="reporter"
                            value={formData.reporter}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                          >
                            <option value="">None</option>
                            {users.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <UserIcon size={14} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                        {editUserId ? "New Password (Optional)" : "Password"}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          required={!editUserId}
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-10"
                          placeholder={editUserId ? "Leave blank to keep current" : "••••••••"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">App Password</label>
                      <div className="relative">
                        <input
                          type={showAppPassword ? "text" : "password"}
                          name="appPassword"
                          value={formData.appPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-10"
                          placeholder="App Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAppPassword(!showAppPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {showAppPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Additional Details</h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Personal Email</label>
                      <input
                        type="email"
                        name="personalEmail"
                        value={formData.personalEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="sarah.personal@gmail.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Official Phone</label>
                        <input
                          type="tel"
                          name="phone_official"
                          value={formData.phoneNumber.official}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          placeholder="+1 234..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Personal Phone</label>
                        <input
                          type="tel"
                          name="phone_personal"
                          value={formData.phoneNumber.personal}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          placeholder="+1 987..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Date of Joining</label>
                        <input
                          type="date"
                          name="dateOfJoining"
                          value={formData.dateOfJoining}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="isDisabled"
                        name="isDisabled"
                        checked={formData.isDisabled}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isDisabled" className="text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer">
                        Disable User Account
                      </label>
                    </div>

                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {isSubmitting ? (editUserId ? "Saving..." : "Creating...") : (editUserId ? "Save Changes" : "Create User")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
