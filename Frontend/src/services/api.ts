const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || error.message || 'API request failed');
    }

    return response.json();
}

// Jobs API
export const jobsAPI = {
    getAll: () => apiCall<any[]>('/jobs'),
    getById: (id: string) => apiCall<any>(`/jobs/${id}`),
    create: (data: any) => apiCall<any>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall<any>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall<any>(`/jobs/${id}`, { method: 'DELETE' }),
};

// Candidates API
export const candidatesAPI = {
    getAll: () => apiCall<any[]>('/candidates'),
    getById: (id: string) => apiCall<any>(`/candidates/${id}`),
    create: (data: any) => apiCall<any>('/candidates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall<any>(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall<any>(`/candidates/${id}`, { method: 'DELETE' }),
};

// Applications API
export const applicationsAPI = {
    getAll: () => apiCall<any[]>('/applications'),
    getById: (id: string) => apiCall<any>(`/applications/${id}`),
    create: (data: any) => apiCall<any>('/applications', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall<any>(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall<any>(`/applications/${id}`, { method: 'DELETE' }),
};

// Feedback API
export const feedbackAPI = {
    getAll: () => apiCall<any[]>('/feedback'),
    getById: (id: string) => apiCall<any>(`/feedback/${id}`),
    create: (data: any) => apiCall<any>('/feedback', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall<any>(`/feedback/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall<any>(`/feedback/${id}`, { method: 'DELETE' }),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => apiCall<any>('/dashboard/stats'),
};

// Reports API
export const reportsAPI = {
    getReports: () => apiCall<any>('/reports'),
};

// Activity Log API
export const activityLogAPI = {
    getAll: (limit?: number) => apiCall<any[]>(`/activity-log${limit ? `?limit=${limit}` : ''}`),
    getByType: (type: string) => apiCall<any[]>(`/activity-log/${type}`),
};




