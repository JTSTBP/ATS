import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { lazy, Suspense } from "react";

const Login = lazy(() => import("./pages/Login"));

const AdminDashboard = lazy(() => import("./components/AdminPanel/dashboard"));
const TalentDatabase = lazy(() => import("./components/TalentDatabase/Index"));
const Dashboard = lazy(() => import("./components/RecruiterPanel/Dashboard"));
const UploadCV = lazy(() => import("./components/RecruiterPanel/UploadCV"));
const Candidates = lazy(() => import("./components/RecruiterPanel/Candidates"));
const FollowUps = lazy(() => import("./components/RecruiterPanel/FollowUps"));
const Reports = lazy(() => import("./components/RecruiterPanel/Reports"));
const LeaveApplications = lazy(() => import("./components/RecruiterPanel/LeaveApplications"));
const ManagerPanel = lazy(() => import("./pages/ManagerPanel"));

const MainLayout = lazy(() => import("./pages/Recruiterpanel"));
const AdminLayout = lazy(() => import("./pages/AdminPanel"));
const UserManagement = lazy(() => import("./components/AdminPanel/usermanagement"));

const ReportsTab = lazy(() => import("./components/AdminPanel/reports"));
const AnalyticsTab = lazy(() => import("./components/AdminPanel/analytics"));
const MentorLayout = lazy(() => import("./pages/mentor"));
const JobsManager = lazy(() => import("./components/MentorPanel/pages/Jobs").then((m) => ({ default: m.JobsManager })));
const CandidatesManager = lazy(() => import("./components/MentorPanel/pages/Candidates").then((m) => ({ default: m.CandidatesManager })));

const MentorDashboard = lazy(() => import("./components/MentorPanel/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const ApplicationsManager = lazy(() => import("./components/MentorPanel/pages/applications/ApplicationsManager").then((m) => ({ default: m.ApplicationsManager })));
const ActivityLog = lazy(() => import("./components/MentorPanel/pages/ActivityLog").then((m) => ({ default: m.ActivityLog })));
const MentorLeaveApplications = lazy(() => import("./components/MentorPanel/pages/LeaveApplications"));
const ClientsManager = lazy(() => import("./components/MentorPanel/pages/Clients/ClientsManager").then((m) => ({ default: m.ClientsManager })));

const CandidatesList = lazy(() => import("./components/MentorPanel/pages/Job/candidateslist"));
const TeamRecruiters = lazy(() => import("./components/MentorPanel/pages/TeamRecruiters"));
const ManagerDashboard = lazy(() => import("./components/ManagerPanel/Dashboard"));
const ManagerReports = lazy(() => import("./components/ManagerPanel/Reports"));
const MentorReports = lazy(() => import("./components/MentorPanel/pages/Reports").then((m) => ({ default: m.MentorReports })));
const AdminActivityLogs = lazy(() => import("./components/AdminPanel/activitylogs"));
const OrphanCandidates = lazy(() => import("./components/AdminPanel/OrphanCandidates"));
const CandidateActivityTimeline = lazy(() => import("./components/AdminPanel/CandidateActivityTimeline"));
const CeoDailyReportSettings = lazy(() => import("./components/AdminPanel/CeoDailyReportSettings"));

const Finance = lazy(() => import("./components/AdminPanel/Finance"));
const StatementsUpload = lazy(() => import("./components/AdminPanel/StatementsUpload"));
const AdminCandidates = lazy(() => import("./components/AdminPanel/Candidates").then((m) => ({ default: m.AdminCandidates })));
const ManagerCandidates = lazy(() => import("./components/ManagerPanel/Candidates").then((m) => ({ default: m.ManagerCandidates })));
const ManagerTeamRecruiters = lazy(() => import("./components/ManagerPanel/ManagerTeamRecruiters"));
const Attendance = lazy(() => import("./components/AdminPanel/attendance"));
const ReturnInvoices = lazy(() => import("./components/AdminPanel/ReturnInvoices"));
const CreateReturnInvoicePage = lazy(() => import("./pages/Admin/ReturnInvoices/CreateReturnInvoicePage"));
const JobPreviewPage = lazy(() => import("./components/RecruiterPanel/JobPreviewPage"));
const JobPreviewDetails = lazy(() => import("./components/RecruiterPanel/JobPreviewDetails"));
const UploadCandidatePage = lazy(() => import("./components/RecruiterPanel/UploadCandidatePage"));
const UploadSourceCandidatePage = lazy(() => import("./components/RecruiterPanel/UploadSourceCandidatePage"));

const Profile = lazy(() => import("./components/RecruiterPanel/Profile"));

function App() {
  return (
    <>
      <Router>
        <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
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
              <Route path="/Mentor/team" element={<TeamRecruiters />} />
              <Route path="/Mentor/upload-source-candidate" element={<UploadSourceCandidatePage />} />
              <Route path="/Mentor/upload-source-candidate/:jobId" element={<UploadSourceCandidatePage />} />
              <Route path="/Mentor/talent-database" element={<TalentDatabase />} />
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
              <Route path="/Admin/attendance" element={<Attendance />} />
              <Route path="/Admin/finance" element={<Finance />} />
              <Route path="/Admin/statements-upload" element={<StatementsUpload />} />
              <Route path="/Admin/return-invoices" element={<ReturnInvoices />} />
              <Route path="/Admin/return-invoices/create" element={<CreateReturnInvoicePage />} />
              <Route path="/Admin" element={<AdminDashboard />} />
              <Route path="/Admin/reports" element={<ReportsTab />} />
              <Route path="/Admin/analytics" element={<AnalyticsTab />} />
              <Route path="/Admin/activity" element={<AdminActivityLogs />} />
              <Route path="/Admin/candidate-activity-timeline" element={<CandidateActivityTimeline />} />
              <Route path="/Admin/ceo-daily-report-settings" element={<CeoDailyReportSettings />} />
              <Route path="/Admin/jobs" element={<JobsManager />} />
              <Route path="/Admin/follow-ups" element={<FollowUps />} />
              <Route path="/Admin/jobs/:id/candidates" element={<CandidatesList />} />
              <Route path="/Admin/clients" element={<ClientsManager />} />
              <Route path="/Admin/clients/add" element={<ClientsManager initialFormOpen={true} />} />
              <Route path="/Admin/candidates" element={<AdminCandidates />} />
              <Route path="/Admin/candidates/add" element={<AdminCandidates initialFormOpen={true} />} />
              <Route path="/Admin/talent-database" element={<TalentDatabase />} />
              <Route path="/Admin/upload-source-candidate" element={<UploadSourceCandidatePage />} />
              <Route path="/Admin/upload-source-candidate/:jobId" element={<UploadSourceCandidatePage />} />
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
              <Route path="upload-source-candidate" element={<UploadSourceCandidatePage />} />
              <Route path="upload-source-candidate/:jobId" element={<UploadSourceCandidatePage />} />
              <Route path="candidates" element={<Candidates />} />
              <Route path="follow-ups" element={<FollowUps />} />
              <Route path="reports" element={<Reports />} />
              <Route path="leave-applications" element={<LeaveApplications />} />
              <Route path="talent-database" element={<TalentDatabase />} />

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
              <Route path="candidates" element={<ManagerCandidates />} />
              <Route
                path="candidates/add"
                element={<ManagerCandidates initialFormOpen={true} />}
              />
              <Route path="applications" element={<ApplicationsManager />} />
              <Route path="mentors" element={<Navigate to="/Manager/team" replace />} />
              <Route path="team" element={<ManagerTeamRecruiters />} />
              <Route path="clients" element={<ClientsManager />} />
              <Route path="reports" element={<ManagerReports />} />
              <Route
                path="leave-applications"
                element={<MentorLeaveApplications />}
              />
              <Route path="upload-source-candidate" element={<UploadSourceCandidatePage />} />
              <Route path="upload-source-candidate/:jobId" element={<UploadSourceCandidatePage />} />
              <Route path="talent-database" element={<TalentDatabase />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
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
