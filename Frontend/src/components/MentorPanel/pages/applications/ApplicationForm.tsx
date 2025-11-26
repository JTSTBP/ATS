// import { useState, useEffect } from "react";
// import { X } from "lucide-react";

// type Job = {
//   id: string;
//   title: string;
//   department?: string;
//   status?: string;
// };

// type Candidate = {
//   id: string;
//   full_name: string;
//   email: string;
// };

// type Application = {
//   id: string;
//   job_id: string;
//   candidate_id: string;
//   status: string;
//   stage?: string;
//   priority: string;
//   interview_date?: string;
//   interview_notes?: string;
//   salary_expectation?: string;
// };

// type ApplicationFormProps = {
//   application: Application | null;
//   onClose: () => void;
//   onSave: () => void;
// };

// export const ApplicationForm = ({
//   application,
//   onClose,
//   onSave,
// }: ApplicationFormProps) => {
//   const [jobs, setJobs] = useState<Job[]>([]);
//   const [candidates, setCandidates] = useState<Candidate[]>([]);
//   const [formData, setFormData] = useState({
//     job_id: "",
//     candidate_id: "",
//     status: "Screening",
//     stage: "",
//     priority: "Medium",
//     interview_date: "",
//     interview_notes: "",
//     salary_expectation: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     fetchJobsAndCandidates();
//     if (application) {
//       setFormData({
//         job_id: application.job_id,
//         candidate_id: application.candidate_id,
//         status: application.status,
//         stage: application.stage || "",
//         priority: application.priority,
//         interview_date: application.interview_date
//           ? new Date(application.interview_date).toISOString().split("T")[0]
//           : "",
//         interview_notes: application.interview_notes || "",
//         salary_expectation: application.salary_expectation || "",
//       });
//     }
//   }, [application]);

//   // ✅ Replace this with your own API fetch calls later
//   const fetchJobsAndCandidates = async () => {
//     try {
//       // Example:
//       // const jobsRes = await fetch('/api/jobs?status=Open');
//       // const candidatesRes = await fetch('/api/candidates');
//       // const jobsData = await jobsRes.json();
//       // const candidatesData = await candidatesRes.json();

//       setJobs([]); // placeholder for now
//       setCandidates([]); // placeholder for now
//     } catch (err) {
//       console.error("Error fetching data:", err);
//     }
//   };

//   // ✅ Replace this with your API submission logic later
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const dataToSave = {
//         ...formData,
//         interview_date: formData.interview_date || null,
//       };

//       if (application) {
//         // Example PUT API:
//         // await fetch(`/api/applications/${application.id}`, {
//         //   method: 'PUT',
//         //   headers: { 'Content-Type': 'application/json' },
//         //   body: JSON.stringify(dataToSave),
//         // });
//         console.log("Updating application", dataToSave);
//       } else {
//         // Example POST API:
//         // await fetch('/api/applications', {
//         //   method: 'POST',
//         //   headers: { 'Content-Type': 'application/json' },
//         //   body: JSON.stringify(dataToSave),
//         // });
//         console.log("Creating new application", dataToSave);
//       }

//       onSave();
//     } catch (err) {
//       setError(
//         err instanceof Error ? err.message : "Failed to save application"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//         <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
//           <h3 className="text-2xl font-bold text-gray-800">
//             {application ? "Edit Application" : "New Application"}
//           </h3>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-lg transition"
//           >
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           {error && (
//             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
//               {error}
//             </div>
//           )}

//           {/* Candidate */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Candidate
//             </label>
//             <select
//               value={formData.candidate_id}
//               onChange={(e) =>
//                 setFormData({ ...formData, candidate_id: e.target.value })
//               }
//               required
//               disabled={!!application}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100"
//             >
//               <option value="">Select Candidate</option>
//               {candidates.map((c) => (
//                 <option key={c.id} value={c.id}>
//                   {c.full_name} - {c.email}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Job */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Job
//             </label>
//             <select
//               value={formData.job_id}
//               onChange={(e) =>
//                 setFormData({ ...formData, job_id: e.target.value })
//               }
//               required
//               disabled={!!application}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100"
//             >
//               <option value="">Select Job</option>
//               {jobs.map((j) => (
//                 <option key={j.id} value={j.id}>
//                   {j.title} {j.department ? `- ${j.department}` : ""}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Status + Priority */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Status
//               </label>
//               <select
//                 value={formData.status}
//                 onChange={(e) =>
//                   setFormData({ ...formData, status: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
//               >
//                 <option value="Screening">Screening</option>
//                 <option value="Shortlisted">Shortlisted</option>
//                 <option value="Interview">Interview</option>
//                 <option value="Offer">Offer</option>
//                 <option value="Hired">Hired</option>
//                 <option value="Rejected">Rejected</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Priority
//               </label>
//               <select
//                 value={formData.priority}
//                 onChange={(e) =>
//                   setFormData({ ...formData, priority: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
//               >
//                 <option value="High">High</option>
//                 <option value="Medium">Medium</option>
//                 <option value="Low">Low</option>
//               </select>
//             </div>
//           </div>

//           {/* Interview Date + Stage */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Interview Date
//               </label>
//               <input
//                 type="date"
//                 value={formData.interview_date}
//                 onChange={(e) =>
//                   setFormData({ ...formData, interview_date: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Stage
//               </label>
//               <input
//                 type="text"
//                 value={formData.stage}
//                 onChange={(e) =>
//                   setFormData({ ...formData, stage: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
//                 placeholder="e.g., Technical Round 1"
//               />
//             </div>
//           </div>

//           {/* Salary + Notes */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Salary Expectation
//             </label>
//             <input
//               type="text"
//               value={formData.salary_expectation}
//               onChange={(e) =>
//                 setFormData({ ...formData, salary_expectation: e.target.value })
//               }
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
//               placeholder="e.g., $100,000"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Interview Notes
//             </label>
//             <textarea
//               value={formData.interview_notes}
//               onChange={(e) =>
//                 setFormData({ ...formData, interview_notes: e.target.value })
//               }
//               rows={4}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
//               placeholder="Notes from interviews..."
//             />
//           </div>

//           <div className="flex justify-end space-x-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition disabled:opacity-50"
//             >
//               {loading ? "Saving..." : application ? "Update" : "Create"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { jobsAPI, candidatesAPI, applicationsAPI } from "../../../../services/api";

type Job = {
  id: string;
  title: string;
  department?: string;
  status?: string;
};

type Candidate = {
  id: string;
  full_name: string;
  email: string;
};

type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  stage?: string;
  priority: string;
  interview_date?: string;
  interview_notes?: string;
  salary_expectation?: string;
};

type ApplicationFormProps = {
  application: Application | null;
  onClose: () => void;
  onSave: () => void;
};

export const ApplicationForm = ({
  application,
  onClose,
  onSave,
}: ApplicationFormProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [formData, setFormData] = useState({
    job_id: "",
    candidate_id: "",
    status: "Shortlisted",
    stage: "",
    priority: "Medium",
    interview_date: "",
    interview_notes: "",
    interview_round: "",
    salary_expectation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobsAndCandidates();
  }, []);

  useEffect(() => {
    if (application) {
      setFormData({
        job_id: application.job_id || "",
        candidate_id: application.candidate_id || "",
        status: application.status || "Shortlisted",
        stage: application.stage || "",
        priority: application.priority || "Medium",
        interview_date: application.interview_date
          ? new Date(application.interview_date).toISOString().split("T")[0]
          : "",
        interview_notes: application.interview_notes || "",
        interview_round: (application as any).interview_round || "",
        salary_expectation: application.salary_expectation || "",
      });
    }
  }, [application]);

  const fetchJobsAndCandidates = async () => {
    try {
      const [jobsData, candidatesData] = await Promise.all([
        jobsAPI.getAll(),
        candidatesAPI.getAll(),
      ]);
      setJobs(jobsData.filter((job: Job) => job.status === 'Open'));
      setCandidates(candidatesData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const dataToSave: any = {
        job_id: formData.job_id,
        candidate_id: formData.candidate_id,
        status: formData.status,
        notes: formData.interview_notes || '',
      };

      // Add interview round if status is Shortlisted or Interview
      if (formData.status === "Shortlisted" || formData.status === "Interviewed") {
        if (formData.interview_round) {
          dataToSave.interview_round = formData.interview_round;
        }
      }

      if (application) {
        await applicationsAPI.update(application.id, dataToSave);
      } else {
        await applicationsAPI.create(dataToSave);
      }

      onSave();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save application"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">
            {application ? "Edit Application" : "New Application"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Candidate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidate
            </label>
            <select
              value={formData.candidate_id}
              onChange={(e) =>
                setFormData({ ...formData, candidate_id: e.target.value })
              }
              required
              disabled={!!application}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select Candidate</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} - {c.email}
                </option>
              ))}
            </select>
          </div>

          {/* Job */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job
            </label>
            <select
              value={formData.job_id}
              onChange={(e) =>
                setFormData({ ...formData, job_id: e.target.value })
              }
              required
              disabled={!!application}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select Job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} {j.department ? `- ${j.department}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="Shortlisted">Shortlisted</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interviewed">Interviewed</option>
                <option value="Selected">Selected</option>
                <option value="Joined">Joined</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Interview Date + Interview Round */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Date
              </label>
              <input
                type="date"
                value={formData.interview_date}
                onChange={(e) =>
                  setFormData({ ...formData, interview_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            {(formData.status === "Shortlisted" ||
              formData.status === "Interviewed") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Round <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.interview_round}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interview_round: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-blue-50"
                    required
                  >
                    <option value="">Select Interview Round</option>
                    <option value="Round 1">Round 1</option>
                    <option value="Round 2">Round 2</option>
                    <option value="Round 3">Round 3</option>
                    <option value="Round 4">Round 4</option>
                    <option value="Final Round">Final Round</option>
                  </select>
                </div>
              )}
          </div>

          {/* Salary + Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Expectation
            </label>
            <input
              type="text"
              value={formData.salary_expectation}
              onChange={(e) =>
                setFormData({ ...formData, salary_expectation: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="e.g., $100,000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Notes
            </label>
            <textarea
              value={formData.interview_notes}
              onChange={(e) =>
                setFormData({ ...formData, interview_notes: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Notes from interviews..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : application ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};