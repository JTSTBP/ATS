// import { motion, AnimatePresence } from "framer-motion";
// import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
// import { useState, useMemo } from "react";
// import JobOpeningCard from "../RecruiterPnel/JobOpeningCard";
// import CandidateModal from "../RecruiterPnel/CandidateModal";
// import CandidateList from "../RecruiterPnel/CandidateList";
// import Toast from "./Toast";
// import { useJobContext } from "../../context/DataProvider";

// export interface Skill {
//   name: string;
//   yearsOfExperience: number;
//   proficiencyLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert";
// }

// export interface Experience {
//   title: string;
//   company: string;
//   location: string;
//   startDate: string;
//   endDate: string;
//   current: boolean;
//   description: string;
// }

// export interface Education {
//   degree: string;
//   institution: string;
//   field: string;
//   graduationYear: number;
// }

// export interface Certification {
//   name: string;
//   issuingOrganization: string;
//   issueDate: string;
//   expirationDate?: string;
// }

// export interface Candidate {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   location: string;
//   currentTitle: string;
//   currentCompany: string;
//   totalExperience: number;
//   skills: Skill[];
//   experience: Experience[];
//   education: Education[];
//   certifications: Certification[];
//   resumeUrl?: string;
//   linkedinUrl?: string;
//   portfolioUrl?: string;
//   source: string;
//   status: "New" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";
//   notes: string;
//   recruiterAssigned: string;
//   jobId: string;
//   appliedDate: string;
// }

// export interface JobOpening {
//   id: string;
//   title: string;
//   department: string;
//   location: string;
//   type: string;
//   openPositions: number;
// }

// const mockJobOpenings: JobOpening[] = [
//   {
//     id: "1",
//     title: "Senior Frontend Developer",
//     department: "Engineering",
//     location: "Remote",
//     type: "Full-time",
//     openPositions: 3,
//   },
//   {
//     id: "2",
//     title: "Product Manager",
//     department: "Product",
//     location: "San Francisco, CA",
//     type: "Full-time",
//     openPositions: 2,
//   },
//   {
//     id: "3",
//     title: "UX/UI Designer",
//     department: "Design",
//     location: "New York, NY",
//     type: "Full-time",
//     openPositions: 1,
//   },
//   {
//     id: "4",
//     title: "Backend Engineer",
//     department: "Engineering",
//     location: "Remote",
//     type: "Full-time",
//     openPositions: 4,
//   },
//   {
//     id: "5",
//     title: "DevOps Engineer",
//     department: "Engineering",
//     location: "Austin, TX",
//     type: "Full-time",
//     openPositions: 2,
//   },
//   {
//     id: "6",
//     title: "Marketing Manager",
//     department: "Marketing",
//     location: "Remote",
//     type: "Full-time",
//     openPositions: 1,
//   },
//   {
//     id: "7",
//     title: "Data Scientist",
//     department: "Engineering",
//     location: "Boston, MA",
//     type: "Full-time",
//     openPositions: 2,
//   },
//   {
//     id: "8",
//     title: "Sales Representative",
//     department: "Sales",
//     location: "Chicago, IL",
//     type: "Full-time",
//     openPositions: 5,
//   },
//   {
//     id: "9",
//     title: "Content Writer",
//     department: "Marketing",
//     location: "Remote",
//     type: "Part-time",
//     openPositions: 2,
//   },
//   {
//     id: "10",
//     title: "QA Engineer",
//     department: "Engineering",
//     location: "Seattle, WA",
//     type: "Full-time",
//     openPositions: 3,
//   },
//   {
//     id: "11",
//     title: "HR Manager",
//     department: "Human Resources",
//     location: "New York, NY",
//     type: "Full-time",
//     openPositions: 1,
//   },
//   {
//     id: "12",
//     title: "Financial Analyst",
//     department: "Finance",
//     location: "San Francisco, CA",
//     type: "Full-time",
//     openPositions: 2,
//   },
//   {
//     id: "13",
//     title: "Mobile Developer",
//     department: "Engineering",
//     location: "Remote",
//     type: "Contract",
//     openPositions: 2,
//   },
//   {
//     id: "14",
//     title: "Customer Success Manager",
//     department: "Customer Support",
//     location: "Austin, TX",
//     type: "Full-time",
//     openPositions: 3,
//   },
//   {
//     id: "15",
//     title: "Graphic Designer",
//     department: "Design",
//     location: "Los Angeles, CA",
//     type: "Part-time",
//     openPositions: 1,
//   },
// ];

// const ITEMS_PER_PAGE = 6;

// export default function UploadCV() {
//   const [candidates, setCandidates] = useState<Candidate[]>([]);
//   const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(
//     null
//   );
//   const [toast, setToast] = useState<{
//     message: string;
//     type: "success" | "error";
//   } | null>(null);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filters, setFilters] = useState({
//     department: "All",
//     location: "All",
//     type: "All",
//   });

//     const { jobs, loading, fetchJobs, createJob, updateJob, deleteJob } =
//       useJobContext();
//   const departments = useMemo(() => {
//     const depts = Array.from(
//       new Set(mockJobOpenings.map((job) => job.department))
//     );
//     return ["All", ...depts];
//   }, []);

//   const locations = useMemo(() => {
//     const locs = Array.from(
//       new Set(mockJobOpenings.map((job) => job.location))
//     );
//     return ["All", ...locs];
//   }, []);

//   const jobTypes = ["All", "Full-time", "Part-time", "Contract"];

//   const filteredJobs = jobs(() => {
//     return mockJobOpenings.filter((job) => {
//     const matchesSearch =~
//         job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         job.department.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchesDepartment =
//         filters.department === "All" || job.department === filters.department;
//       const matchesLocation =
//         filters.location === "All" || job.location === filters.location;
//       const matchesType = filters.type === "All" || job.type === filters.type;

//       return (
//         matchesSearch && matchesDepartment && matchesLocation && matchesType
//       );
//     });
//   }, [searchQuery, filters]);

//   const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
//   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//   const endIndex = startIndex + ITEMS_PER_PAGE;
//   const currentJobs = filteredJobs.slice(startIndex, endIndex);

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleFilterChange = (
//     filterType: keyof typeof filters,
//     value: string
//   ) => {
//     setFilters((prev) => ({ ...prev, [filterType]: value }));
//     setCurrentPage(1);
//   };

//   const handleSearchChange = (value: string) => {
//     setSearchQuery(value);
//     setCurrentPage(1);
//   };

//   const handleUploadCandidate = (job: JobOpening) => {
//     setSelectedJob(job);
//     setEditingCandidate(null);
//     setIsModalOpen(true);
//   };

//   const handleSaveCandidate = (
//     candidateData: Omit<Candidate, "id" | "appliedDate">
//   ) => {
//     if (editingCandidate) {
//       setCandidates(
//         candidates.map((c) =>
//           c.id === editingCandidate.id
//             ? { ...candidateData, id: c.id, appliedDate: c.appliedDate }
//             : c
//         )
//       );
//       setToast({ message: "Candidate updated successfully!", type: "success" });
//     } else {
//       const newCandidate: Candidate = {
//         ...candidateData,
//         id: Date.now().toString(),
//         appliedDate: new Date().toISOString(),
//       };
//       setCandidates([...candidates, newCandidate]);
//       setToast({ message: "Candidate added successfully!", type: "success" });
//     }
//     setIsModalOpen(false);
//     setEditingCandidate(null);
//   };

//   const handleEditCandidate = (candidate: Candidate) => {
//     const job = mockJobOpenings.find((j) => j.id === candidate.jobId);
//     setSelectedJob(job || null);
//     setEditingCandidate(candidate);
//     setIsModalOpen(true);
//   };

//   const handleDeleteCandidate = (id: string) => {
//     setCandidates(candidates.filter((c) => c.id !== id));
//     setToast({ message: "Candidate deleted successfully!", type: "success" });
//   };

//   const handleViewCandidate = (candidate: Candidate) => {
//     const job = mockJobOpenings.find((j) => j.id === candidate.jobId);
//     setSelectedJob(job || null);
//     setEditingCandidate(candidate);
//     setIsModalOpen(true);
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="pb-8"
//     >
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-slate-800 mb-2">
//           Upload Candidate CV
//         </h1>
//         <p className="text-slate-600">
//           Select a job opening and add candidate details
//         </p>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
//         <div className="flex items-center gap-2 mb-4">
//           <Filter size={20} className="text-slate-600" />
//           <h3 className="font-semibold text-slate-800">Filter Job Openings</h3>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-2">
//               Search
//             </label>
//             <div className="relative">
//               <Search
//                 size={18}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//               />
//               <input
//                 type="text"
//                 placeholder="Search jobs..."
//                 value={searchQuery}
//                 onChange={(e) => handleSearchChange(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-2">
//               Department
//             </label>
//             <select
//               value={filters.department}
//               onChange={(e) => handleFilterChange("department", e.target.value)}
//               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//             >
//               {departments.map((dept) => (
//                 <option key={dept} value={dept}>
//                   {dept}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-2">
//               Location
//             </label>
//             <select
//               value={filters.location}
//               onChange={(e) => handleFilterChange("location", e.target.value)}
//               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//             >
//               {locations.map((loc) => (
//                 <option key={loc} value={loc}>
//                   {loc}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-2">
//               Job Type
//             </label>
//             <select
//               value={filters.type}
//               onChange={(e) => handleFilterChange("type", e.target.value)}
//               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//             >
//               {jobTypes.map((type) => (
//                 <option key={type} value={type}>
//                   {type}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
//           <span>
//             Showing {startIndex + 1}-{Math.min(endIndex, filteredJobs.length)}{" "}
//             of {filteredJobs.length} jobs
//           </span>
//           {(searchQuery ||
//             filters.department !== "All" ||
//             filters.location !== "All" ||
//             filters.type !== "All") && (
//             <button
//               onClick={() => {
//                 setSearchQuery("");
//                 setFilters({ department: "All", location: "All", type: "All" });
//                 setCurrentPage(1);
//               }}
//               className="text-blue-600 hover:text-blue-700 font-medium"
//             >
//               Clear Filters
//             </button>
//           )}
//         </div>
//       </div>

//       {currentJobs.length === 0 ? (
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
//           <p className="text-slate-500 text-lg">
//             No jobs found matching your criteria
//           </p>
//           <p className="text-slate-400 text-sm mt-2">
//             Try adjusting your filters
//           </p>
//         </div>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//             {currentJobs.map((job, index) => (
//               <motion.div
//                 key={job.id}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: index * 0.1 }}
//               >
//                 <JobOpeningCard
//                   job={job}
//                   onUploadCandidate={handleUploadCandidate}
//                   candidateCount={
//                     candidates.filter((c) => c.jobId === job.id).length
//                   }
//                 />
//               </motion.div>
//             ))}
//           </div>

//           {totalPages > 1 && (
//             <div className="flex items-center justify-center gap-2 mb-12">
//               <button
//                 onClick={() => handlePageChange(currentPage - 1)}
//                 disabled={currentPage === 1}
//                 className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
//               >
//                 <ChevronLeft size={18} />
//                 Previous
//               </button>

//               <div className="flex items-center gap-2">
//                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(
//                   (page) => (
//                     <button
//                       key={page}
//                       onClick={() => handlePageChange(page)}
//                       className={`w-10 h-10 rounded-lg font-medium transition-colors ${
//                         currentPage === page
//                           ? "bg-blue-600 text-white"
//                           : "border border-slate-300 hover:bg-slate-50"
//                       }`}
//                     >
//                       {page}
//                     </button>
//                   )
//                 )}
//               </div>

//               <button
//                 onClick={() => handlePageChange(currentPage + 1)}
//                 disabled={currentPage === totalPages}
//                 className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
//               >
//                 Next
//                 <ChevronRight size={18} />
//               </button>
//             </div>
//           )}
//         </>
//       )}

//       {candidates.length > 0 && (
//         <CandidateList
//           candidates={candidates}
//           jobs={mockJobOpenings}
//           onView={handleViewCandidate}
//           onEdit={handleEditCandidate}
//           onDelete={handleDeleteCandidate}
//         />
//       )}

//       <AnimatePresence>
//         {isModalOpen && selectedJob && (
//           <CandidateModal
//             job={selectedJob}
//             candidate={editingCandidate}
//             onClose={() => {
//               setIsModalOpen(false);
//               setEditingCandidate(null);
//             }}
//             onSave={handleSaveCandidate}
//           />
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {toast && (
//           <Toast
//             message={toast.message}
//             type={toast.type}
//             onClose={() => setToast(null)}
//           />
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import JobOpeningCard from "../RecruiterPnel/JobOpeningCard";
import CandidateModal from "../RecruiterPnel/CandidateModal";
import CandidateList from "../RecruiterPnel/CandidateList";
import Toast from "./Toast";
import { useJobContext } from "../../context/DataProvider";
import { useAuth } from "../../context/AuthProvider";

export interface Skill {
  name: string;
  yearsOfExperience: number;
  proficiencyLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  field: string;
  graduationYear: number;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  totalExperience: number;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  source: string;
  status: "New" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";
  notes: string;
  recruiterAssigned: string;
  jobId: string;
  appliedDate: string;
}

const ITEMS_PER_PAGE = 6;

export default function UploadCV() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    department: "All",
    location: "All",
    type: "All",
  });

  const { jobs, loading, fetchJobsByCreator, jobsByUser } = useJobContext();
  const { user } = useAuth();

  // Memoized filter options
  const departments = useMemo(
    () => ["All", ...new Set(jobs.map((job) => job.department || "N/A"))],
    [jobs]
  );
  const locations = useMemo(
    () => ["All", ...new Set(jobs.map((job) => job.location || "N/A"))],
    [jobs]
  );
  const jobTypes = ["All", "Full-time", "Part-time", "Contract"];
  useEffect(() => {
    if (user) fetchJobsByCreator(user.reporter._id);
  }, [user]);
  // Filtered job list
  // const filteredJobs = useMemo(() => {
  //   return jobs.filter((job: any) => {
  //     const matchesSearch =
  //       job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       job.department.toLowerCase().includes(searchQuery.toLowerCase());
  //     const matchesDepartment =
  //       filters.department === "All" || job.department === filters.department;
  //     const matchesLocation =
  //       filters.location === "All" || job.location === filters.location;
  //     const matchesType =
  //       filters.type === "All" || job.employmentType === filters.type;
  //     return (
  //       matchesSearch && matchesDepartment && matchesLocation && matchesType
  //     );
  //   });
  // }, [jobs, searchQuery, filters]);

  const filteredJobs = useMemo(() => {
    if (!user?._id) return [];

    return jobsByUser.filter((job: any) => {
      // ✅ Check if this user is one of the assigned recruiters
      const isAssignedRecruiter = job.assignedRecruiters?.some(
        (recruiter: any) => recruiter._id === user._id
      );

      // ✅ Search filter
      const matchesSearch =
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchQuery.toLowerCase());

      // ✅ Department filter
      const matchesDepartment =
        filters.department === "All" || job.department === filters.department;

      // ✅ Location filter
      const matchesLocation =
        filters.location === "All" || job.location === filters.location;

      // ✅ Employment type filter
      const matchesType =
        filters.type === "All" || job.employmentType === filters.type;

      // ✅ Only return jobs assigned to this user that match filters
      return (
        isAssignedRecruiter &&
        matchesSearch &&
        matchesDepartment &&
        matchesLocation &&
        matchesType
      );
    });
  }, [jobsByUser, searchQuery, filters, user]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentJobs = filteredJobs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleUploadCandidate = (job: any) => {
    setSelectedJob(job);
    setEditingCandidate(null);
    setIsModalOpen(true);
  };



  const handleEditCandidate = (candidate: Candidate) => {
    const job = jobs.find((j: any) => j._id === candidate.jobId);
    setSelectedJob(job || null);
    setEditingCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleDeleteCandidate = (id: string) => {
    setCandidates(candidates.filter((c) => c.id !== id));
    setToast({ message: "Candidate deleted successfully!", type: "success" });
  };

  const handleViewCandidate = (candidate: Candidate) => {
    const job = jobs.find((j: any) => j._id === candidate.jobId);
    setSelectedJob(job || null);
    setEditingCandidate(candidate);
    setIsModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Upload Candidate CV
        </h1>
        <p className="text-slate-600">
          Select a job opening and add candidate details
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-slate-600" />
          <h3 className="font-semibold text-slate-800">Filter Job Openings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location
            </label>
            {/* <select
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select> */}
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {locations.map((loc) => (
                <option key={loc._id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Job Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Job Cards */}
      {loading ? (
        <p className="text-center text-slate-500">Loading jobs...</p>
      ) : currentJobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-lg">
            No jobs found matching your criteria
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentJobs.map((job: any, index: number) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <JobOpeningCard
                  job={job}
                  onUploadCandidate={handleUploadCandidate}
                  candidateCount={
                    candidates.filter((c) => c.jobId === job._id).length
                  }
                />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {candidates.length > 0 && (
        <CandidateList
          candidates={candidates}
          jobs={jobs}
          onView={handleViewCandidate}
          onEdit={handleEditCandidate}
          onDelete={handleDeleteCandidate}
        />
      )}

      {/* Candidate Modal */}
      <AnimatePresence>
        {isModalOpen && selectedJob && (
          <CandidateModal
            job={selectedJob}
            candidate={editingCandidate}
            onClose={() => {
              setIsModalOpen(false);
              setEditingCandidate(null);
            }}
            
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
