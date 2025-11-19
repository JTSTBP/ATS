import { useState } from 'react';
import { Dashboard } from '../components/MentorPanel/pages/Dashboard';
import { JobsManager } from '../components/MentorPanel/pages/Jobs';
import { CandidatesManager } from '../components/MentorPanel/pages/Candidates';
import { ApplicationsManager } from '../components/MentorPanel/pages/applications/ApplicationsManager';
import { FeedbackManager } from '../components/MentorPanel/pages/Feedback';
import { Reports } from '../components/MentorPanel/pages/Reports';
import { ActivityLog } from '../components/MentorPanel/pages/ActivityLog';
import { MainLayout } from '../components/MentorPanel/layouts/MainLayout';
import LeaveApplications from '../components/MentorPanel/pages/LeaveApplications';


const MentorPanel = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'jobs':
        return <JobsManager/>;
      case 'candidates':
        return <CandidatesManager />;
      case 'applications':
        return <ApplicationsManager />;
      case 'feedback':
        return <FeedbackManager />;
      case 'reports':
        return <Reports />;
      case 'activity':
        return <ActivityLog />;
      case 'leaveapplications':
        return <LeaveApplications/>
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout onNavigate={setActivePage} activePage={activePage}>
      {renderPage()}
    </MainLayout>
  );
};

export default MentorPanel;
