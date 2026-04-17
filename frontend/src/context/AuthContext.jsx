import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, patientsAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser() {
    try {
      const profileRes = await authAPI.getProfile();
      setUser(profileRes.data);

      if (profileRes.data.role === 'patient') {
        try {
          const patientsRes = await patientsAPI.list();
          const patientList = patientsRes.data.results || patientsRes.data;
          if (patientList.length > 0) {
            setPatient(patientList[0]);
          }
        } catch (e) {
          console.warn('Could not load patient profile:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    const response = await authAPI.login({ username, password });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    await loadUser();
    return response.data;
  }

  async function register(data) {
    const response = await authAPI.register(data);
    await login(data.username, data.password);
    return response.data;
  }

  function logout() {
    localStorage.clear();
    setUser(null);
    setPatient(null);
    window.location.href = '/login';
  }

  async function refreshProfile() {
    await loadUser();
  }

  return (
    <AuthContext.Provider value={{ user, patient, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
