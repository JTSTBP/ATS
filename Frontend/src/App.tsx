import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

import Dashboard from "./components/RecruiterPanel/Dashboard";
import UploadCV from "./components/RecruiterPanel/UploadCV";
import Candidates from "./components/RecruiterPanel/Candidates";
import Reports from "./components/RecruiterPanel/Reports";
import LeaveApplications from "./components/RecruiterPanel/LeaveApplications";
import ManagerPanel from "./pages/ManagerPanel";

import MainLayout from "./pages/Recruiterpanel";
import AdminLayout from "./pages/AdminPanel";
import UserManagement from "./components/AdminPanel/usermanagement";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminDashboard from "./components/AdminPanel/dashboard";
import ReportsTab from "./components/AdminPanel/reports";
import AnalyticsTab from "./components/AdminPanel/analytics";
import MentorLayout from "./pages/mentor";
import { JobsManager } from "./components/MentorPanel/pages/Jobs";
import { CandidatesManager } from "./components/MentorPanel/pages/Candidates";

import { Dashboard as MentorDashboard } from "./components/MentorPanel/pages/Dashboard";
import { ApplicationsManager } from "./components/MentorPanel/pages/applications/ApplicationsManager";
import { ActivityLog } from "./components/MentorPanel/pages/ActivityLog";
import MentorLeaveApplications from "./components/MentorPanel/pages/LeaveApplications";
import { ClientsManager } from "./components/MentorPanel/pages/Clients/ClientsManager";

import CandidatesList from "./components/MentorPanel/pages/Job/candidateslist";
import ManagerDashboard from "./components/ManagerPanel/Dashboard";
import ManagerReports from "./components/ManagerPanel/Reports";
import { MentorReports } from "./components/MentorPanel/pages/Reports";
import AdminActivityLogs from "./components/AdminPanel/activitylogs";

import Finance from "./components/AdminPanel/Finance";
import { AdminCandidates } from "./components/AdminPanel/Candidates";
import JobPreviewPage from "./components/RecruiterPanel/JobPreviewPage";
import JobPreviewDetails from "./components/RecruiterPanel/JobPreviewDetails";
import UploadCandidatePage from "./components/RecruiterPanel/UploadCandidatePage";
import Profile from "./components/RecruiterPanel/Profile";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* mentor */}
          <Route
            path="/Mentor"
            element={
              <ProtectedRoute allowedRoles={["Mentor"]}>
                <MentorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/Mentor" element={<MentorDashboard />} />
            <Route path="/Mentor/jobs" element={<JobsManager />} />
            <Route
              path="/Mentor/jobs/create"
              element={<JobsManager initialFormOpen={true} />}
            />
            <Route
              path="/Mentor/jobs/:id/candidates"
              element={<CandidatesList />}
            />

            <Route path="/Mentor/candidates" element={<CandidatesManager />} />
            <Route
              path="/Mentor/candidates/add"
              element={<CandidatesManager initialFormOpen={true} />}
            />
            <Route
              path="/Mentor/applications"
              element={<ApplicationsManager />}
            />
            <Route
              path="/Mentor/leaveapplications"
              element={<MentorLeaveApplications />}
            />
            <Route path="/Mentor/clients" element={<ClientsManager />} />
            <Route path="/Mentor/reports" element={<MentorReports />} />
            <Route path="/Mentor/activity" element={<ActivityLog />} />
            <Route path="/Mentor/profile" element={<Profile />} />
          </Route>
          {/* admin */}

          <Route
            path="/Admin"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Finance"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/Admin/Users" element={<UserManagement />} />

            <Route
              path="/Admin/leaveApplications"
              element={<MentorLeaveApplications />}
            />
            <Route path="/Admin/finance" element={<Finance />} />
            <Route path="/Admin" element={<AdminDashboard />} />
            <Route path="/Admin/reports" element={<ReportsTab />} />
            <Route path="/Admin/analytics" element={<AnalyticsTab />} />
            <Route path="/Admin/activity" element={<AdminActivityLogs />} />
            <Route path="/Admin/jobs" element={<JobsManager />} />
            <Route path="/Admin/jobs/:id/candidates" element={<CandidatesList />} />
            <Route path="/Admin/clients" element={<ClientsManager />} />
            <Route path="/Admin/clients/add" element={<ClientsManager initialFormOpen={true} />} />
            <Route path="/Admin/candidates" element={<AdminCandidates />} />
            <Route path="/Admin/candidates/add" element={<AdminCandidates initialFormOpen={true} />} />
          </Route>
          {/* recruiter */}
          <Route
            path="/Recruiter"
            element={
              <ProtectedRoute allowedRoles={["Recruiter"]}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="upload-cv" element={<UploadCV />} />
            <Route path="job-preview" element={<JobPreviewPage />} />
            <Route path="job-preview/:id" element={<JobPreviewDetails />} />
            <Route
              path="upload-candidate/:jobId"
              element={<UploadCandidatePage />}
            />
            <Route path="candidates" element={<Candidates />} />
            <Route path="reports" element={<Reports />} />
            <Route path="leave-applications" element={<LeaveApplications />} />

            <Route path="profile" element={<Profile />} />
          </Route>
          {/* manager */}
          <Route
            path="/Manager"
            element={
              <ProtectedRoute allowedRoles={["Manager"]}>
                <ManagerPanel />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagerDashboard />} />
            <Route path="jobs" element={<JobsManager />} />
            <Route
              path="jobs/create"
              element={<JobsManager initialFormOpen={true} />}
            />
            <Route path="jobs/:id/candidates" element={<CandidatesList />} />
            <Route path="candidates" element={<CandidatesManager />} />
            <Route
              path="candidates/add"
              element={<CandidatesManager initialFormOpen={true} />}
            />
            <Route path="applications" element={<ApplicationsManager />} />
            <Route path="clients" element={<ClientsManager />} />
            <Route path="reports" element={<ManagerReports />} />
            <Route
              path="leave-applications"
              element={<MentorLeaveApplications />}
            />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;
