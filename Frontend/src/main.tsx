import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { UserProvider } from "./context/UserProvider.tsx";
import { AuthProvider } from "./context/AuthProvider.tsx";
import { JobProvider } from "./context/DataProvider.tsx";
import { CandidateProvider } from "./context/CandidatesProvider.tsx";
import { ClientsProvider } from "./context/ClientsProvider.tsx";
import { SessionProvider } from "./context/SessionProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
        <JobProvider>
          <CandidateProvider>
            <ClientsProvider>
              <SessionProvider>
                <App />
              </SessionProvider>
            </ClientsProvider>
          </CandidateProvider>
        </JobProvider>
      </UserProvider>
    </AuthProvider>
  </StrictMode>
);
