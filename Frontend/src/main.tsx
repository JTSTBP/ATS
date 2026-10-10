import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { UserProvider } from "./context/UserProvider";
import { AuthProvider } from "./context/AuthProvider";
import { JobProvider } from "./context/DataProvider";
import { CandidateProvider } from "./context/CandidatesProvider";
import { ClientsProvider } from "./context/ClientsProvider";
import { SessionProvider } from "./context/SessionProvider";

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
