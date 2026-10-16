const shared = {
  jobs: () => import("../components/MentorPanel/pages/Jobs"),
  clients: () => import("../components/MentorPanel/pages/Clients/ClientsManager"),
  "talent-database": () => import("../components/TalentDatabase/Index"),
  "follow-ups": () => import("../components/RecruiterPanel/FollowUps"),
};

const panels: Record<string, Record<string, () => Promise<unknown>>> = {
  admin: {
    "": () => import("../components/AdminPanel/dashboard"),
    candidates: () => import("../components/AdminPanel/Candidates"),
    users: () => import("../components/AdminPanel/usermanagement"),
    reports: () => import("../components/AdminPanel/reports"),
    finance: () => import("../components/AdminPanel/Finance"),
    attendance: () => import("../components/AdminPanel/attendance"),
    analytics: () => import("../components/AdminPanel/analytics"),
    activity: () => import("../components/AdminPanel/activitylogs"),
    "ceo-daily-report-settings": () => import("../components/AdminPanel/CeoDailyReportSettings"),
    "candidate-activity-timeline": () => import("../components/AdminPanel/CandidateActivityTimeline"),
    "statements-upload": () => import("../components/AdminPanel/StatementsUpload"),
    "return-invoices": () => import("../components/AdminPanel/ReturnInvoices"),
  },
  manager: {
    "": () => import("../components/ManagerPanel/Dashboard"),
    candidates: () => import("../components/ManagerPanel/Candidates"),
    reports: () => import("../components/ManagerPanel/Reports"),
    team: () => import("../components/ManagerPanel/ManagerTeamRecruiters"),
  },
  mentor: {
    "": () => import("../components/MentorPanel/pages/Dashboard"),
    candidates: () => import("../components/MentorPanel/pages/Candidates"),
    reports: () => import("../components/MentorPanel/pages/Reports"),
    team: () => import("../components/MentorPanel/pages/TeamRecruiters"),
  },
  recruiter: {
    "": () => import("../components/RecruiterPanel/Dashboard"),
    candidates: () => import("../components/RecruiterPanel/Candidates"),
    reports: () => import("../components/RecruiterPanel/Reports"),
    "job-preview": () => import("../components/RecruiterPanel/JobPreviewPage"),
    "upload-cv": () => import("../components/RecruiterPanel/UploadCV"),
  },
};

const pending = new Map<string, Promise<unknown>>();

export function preloadPanelRoute(path: string) {
  const [panel, page = ""] = path.toLowerCase().split("/").filter(Boolean);
  const load = panels[panel]?.[page] || shared[page as keyof typeof shared];
  if (!load || pending.has(path)) return;
  pending.set(path, load().catch(() => { pending.delete(path); }));
}
