// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
// import Login from "./pages/Login";

// import Dashboard from "./components/RecruiterPnel/Dashboard";
// import UploadCV from "./components/RecruiterPnel/UploadCV";
// import Candidates from "./components/RecruiterPnel/Candidates";
// import Reports from "./components/RecruiterPnel/Reports";
// import LeaveApplications from "./components/RecruiterPnel/LeaveApplications";
// import ManagerPanel from "./pages/ManagerPanel";


// import MainLayout from "./pages/Recruiterpanel";
// import AdminLayout from "./pages/AdminPanel";
// import UserManagement from "./components/AdminPanel/usermanagement";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import AdminRoleSettings from "./components/AdminPanel/setting";
// import AdminDashboard from "./components/AdminPanel/dashboard";
// import ReportsTab from "./components/AdminPanel/reports";
// import AnalyticsTab from "./components/AdminPanel/analytics";
// import SettingsTab from "./components/AdminPanel/setting";
// import MentorLayout from "./pages/mentor";
// import { JobsManager } from "./components/MentorPanel/pages/Jobs";
// import { CandidatesManager } from "./components/MentorPanel/pages/Candidates";


// import { Dashboard as MentorDashboard } from "./components/MentorPanel/pages/Dashboard";
// import { ApplicationsManager } from "./components/MentorPanel/pages/applications/ApplicationsManager";
// import { FeedbackManager } from "./components/MentorPanel/pages/Feedback";
// import { ActivityLog } from "./components/MentorPanel/pages/ActivityLog";
// import { Reports as MentorReports } from "./components/MentorPanel/pages/Reports";
// import MentorLeaveApplications from "./components/MentorPanel/pages/LeaveApplications";
// import RolesAndPermissions from "./components/AdminPanel/roles&permission";

// function App() {
//   return (
//     <>
//       <AuthProvider>
//         <Router>
//           <Routes>
//             <Route path="/login" element={<Login />} />
//             <Route
//               path="/Mentor"
//               element={
//                 <ProtectedRoute allowedRoles={["Mentor"]}>
//                   <MentorLayout />
//                 </ProtectedRoute>
//               }
//             >
//               <Route path="/Mentor" element={<MentorDashboard />} />
//               <Route path="/Mentor/jobs" element={<JobsManager />} />
//               <Route
//                 path="/Mentor/candidates"
//                 element={<CandidatesManager />}
//               />
//               <Route
//                 path="/Mentor/applications"
//                 element={<ApplicationsManager />}
//               />
//               <Route
//                 path="/Mentor/leaveapplications"
//                 element={<MentorLeaveApplications />}
//               />
//               <Route path="/Mentor/feedback" element={<FeedbackManager />} />
//               <Route path="/Mentor/reports" element={<MentorReports />} />
//               <Route path="/Mentor/activity" element={<ActivityLog />} />
//             </Route>

//             <Route
//               path="/Admin"
//               element={
//                 <ProtectedRoute allowedRoles={["Admin"]}>
//                   <AdminLayout />
//                 </ProtectedRoute>
//               }
//             >
//               <Route path="/Admin/Users" element={<UserManagement />} />
//               <Route path="/Admin/Setting" element={<SettingsTab />} />
//               <Route path="/Admin" element={<AdminDashboard />} />
//               <Route path="/Admin/reports" element={<ReportsTab />} />
//               <Route path="/Admin/roles" element={<RolesAndPermissions/>} />
//               <Route path="/Admin/analytics" element={<AnalyticsTab />} />
//             </Route>
//             <Route
//               path="/Recruiter"
//               element={
//                 <ProtectedRoute allowedRoles={["Recruiter"]}>
//                   <MainLayout />
//                 </ProtectedRoute>
//               }
//             >
//               <Route index element={<Dashboard />} />
//               <Route path="upload-cv" element={<UploadCV />} />
//               <Route path="candidates" element={<Candidates />} />
//               <Route path="reports" element={<Reports />} />
//               <Route
//                 path="leave-applications"
//                 element={<LeaveApplications />}
//               />
//             </Route>

//             <Route
//               path="/manager"
//               element={
//                 <ProtectedRoute allowedRoles={["Manager"]}>
//                   <ManagerPanel />
//                 </ProtectedRoute>
//               }
//             />

//             <Route path="/" element={<Navigate to="/login" replace />} />
//             <Route path="*" element={<Navigate to="/login" replace />} />
//           </Routes>
//         </Router>
//       </AuthProvider>
//       <ToastContainer
//         position="top-right"
//         autoClose={3000}
//         hideProgressBar={false}
//         newestOnTop={false}
//         closeOnClick
//         pauseOnHover
//         theme="colored"
//       />
//     </>
//   );
// }

// export default App;
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Login
import Login from "./pages/Login";

// Recruiter
import MainLayout from "./pages/Recruiterpanel";
import RecruiterDashboard from "./components/RecruiterPnel/Dashboard";
import UploadCV from "./components/RecruiterPnel/UploadCV";
import RecruiterCandidates from "./components/RecruiterPnel/Candidates";
import RecruiterReports from "./components/RecruiterPnel/Reports";
import RecruiterLeaveApps from "./components/RecruiterPnel/LeaveApplications";

// Admin
import AdminLayout from "./pages/AdminPanel";
import UserManagement from "./components/AdminPanel/usermanagement";
import SettingsTab from "./components/AdminPanel/setting";
import AdminDashboard from "./components/AdminPanel/dashboard";
import ReportsTab from "./components/AdminPanel/reports";
import AnalyticsTab from "./components/AdminPanel/analytics";
import RolesAndPermissions from "./components/AdminPanel/roles&permission";

// Mentor
import MentorLayout from "./pages/mentor";
import { Dashboard as MentorDashboard } from "./components/MentorPanel/pages/Dashboard";
import { JobsManager } from "./components/MentorPanel/pages/Jobs";
import { CandidatesManager } from "./components/MentorPanel/pages/Candidates";
import { ApplicationsManager } from "./components/MentorPanel/pages/applications/ApplicationsManager";
import { FeedbackManager } from "./components/MentorPanel/pages/Feedback";
import { ActivityLog } from "./components/MentorPanel/pages/ActivityLog";
import { Reports as MentorReports } from "./components/MentorPanel/pages/Reports";
import MentorLeaveApps from "./components/MentorPanel/pages/LeaveApplications";

// MANAGER PANEL — NEW
import ManagerLayout from "./components/ManagerPanel/ManagerLayout";
import ManagerDashboard from "./components/ManagerPanel/pages/Dashboard";
import ManagerCandidates from "./components/ManagerPanel/pages/Candidates";
import ManagerApplications from "./components/ManagerPanel/pages/Applications";
import ManagerReports from "./components/ManagerPanel/pages/Reports";
import ManagerLeaveApps from "./components/ManagerPanel/pages/LeaveApplications";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <AuthProvider>
        <Router>
          <Routes>

            {/* LOGIN */}
            <Route path="/login" element={<Login />} />

            {/* ====================== MENTOR PANEL ====================== */}
            <Route
              path="/Mentor"
              element={
                <ProtectedRoute allowedRoles={["Mentor"]}>
                  <MentorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MentorDashboard />} />
              <Route path="jobs" element={<JobsManager />} />
              <Route path="candidates" element={<CandidatesManager />} />
              <Route path="applications" element={<ApplicationsManager />} />
              <Route path="leaveapplications" element={<MentorLeaveApps />} />
              <Route path="feedback" element={<FeedbackManager />} />
              <Route path="reports" element={<MentorReports />} />
              <Route path="activity" element={<ActivityLog />} />
            </Route>

            {/* ====================== ADMIN PANEL ====================== */}
            <Route
              path="/Admin"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="Users" element={<UserManagement />} />
              <Route path="Setting" element={<SettingsTab />} />
              <Route path="reports" element={<ReportsTab />} />
              <Route path="roles" element={<RolesAndPermissions />} />
              <Route path="analytics" element={<AnalyticsTab />} />
            </Route>

            {/* ====================== RECRUITER PANEL ====================== */}
            <Route
              path="/Recruiter"
              element={
                <ProtectedRoute allowedRoles={["Recruiter"]}>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RecruiterDashboard />} />
              <Route path="upload-cv" element={<UploadCV />} />
              <Route path="candidates" element={<RecruiterCandidates />} />
              <Route path="reports" element={<RecruiterReports />} />
              <Route path="leave-applications" element={<RecruiterLeaveApps />} />
            </Route>

            {/* ====================== MANAGER PANEL (NEW) ====================== */}
            <Route
              path="/Manager"
              element={
                <ProtectedRoute allowedRoles={["Manager"]}>
                  <ManagerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ManagerDashboard />} />
              <Route path="candidates" element={<ManagerCandidates />} />
              <Route path="applications" element={<ManagerApplications />} />
              <Route path="reports" element={<ManagerReports />} />
              <Route path="leave-applications" element={<ManagerLeaveApps />} />
            </Route>

            {/* DEFAULT REDIRECTS */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </>
  );
}

export default App;
