/**
 * Centralized configuration for the application
 * All backend API URLs should reference this config
 */

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const API_ENDPOINTS = {
    JOBS: `${API_BASE_URL}/api/jobs`,
    CANDIDATES: `${API_BASE_URL}/api/CandidatesJob`,
    CLIENTS: `${API_BASE_URL}/api/clients`,
    USERS: `${API_BASE_URL}/api/users`,
    AUTH: `${API_BASE_URL}/api/auth`,
    APPLICATIONS: `${API_BASE_URL}/api/applications`,
};
