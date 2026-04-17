import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh expired tokens
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccess = response.data.access;
        localStorage.setItem('access_token', newAccess);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
        refreshQueue.forEach((p) => p.resolve(newAccess));
        refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach((p) => p.reject(refreshError));
        refreshQueue = [];
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API endpoint helpers
export const authAPI = {
  login: (credentials) => api.post('/api/v1/auth/token/', credentials),
  register: (data) => api.post('/api/v1/auth/register/', data),
  getProfile: () => api.get('/api/v1/auth/profile/'),
  updateProfile: (data) => api.patch('/api/v1/auth/profile/', data),
};

export const patientsAPI = {
  list: () => api.get('/api/v1/patients/'),
  get: (uuid) => api.get(`/api/v1/patients/${uuid}/`),
  summary: (uuid) => api.get(`/api/v1/patients/${uuid}/summary/`),
  update: (uuid, data) => api.patch(`/api/v1/patients/${uuid}/`, data),
  create: (data) => api.post('/api/v1/patients/', data),
};

export const recordsAPI = {
  listEncounters: (params = {}) => api.get('/api/v1/encounters/', { params }),
  getEncounter: (uuid) => api.get(`/api/v1/encounters/${uuid}/`),
  listObservations: () => api.get('/api/v1/observations/'),
  listMedications: () => api.get('/api/v1/medications/'),
  listLabResults: () => api.get('/api/v1/lab-results/'),
};

export const documentsAPI = {
  list: () => api.get('/api/v1/documents/'),
  upload: (formData) =>
    api.post('/api/v1/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  download: (uuid) => api.get(`/api/v1/documents/${uuid}/download/`),
  delete: (uuid) => api.delete(`/api/v1/documents/${uuid}/`),
};

export const consentAPI = {
  list: () => api.get('/api/v1/consents/'),
  generateQR: (patientUuid, data) =>
    api.post(`/api/v1/patients/${patientUuid}/qr/`, data),
  verifyQR: (token) => api.post(`/api/v1/qr/${token}/verify/`),
  revoke: (uuid) => api.post(`/api/v1/consents/${uuid}/revoke/`),
};

export const analyticsAPI = {
  summary: () => api.get('/api/v1/admin/analytics/summary/'),
};

export const fhirAPI = {
  exportPatient: (uuid) => api.get(`/api/v1/fhir/Patient/${uuid}/everything/`),
};
