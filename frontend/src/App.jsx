import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Encounters from './pages/Encounters';
import EncounterDetail from './pages/EncounterDetail';
import LabResults from './pages/LabResults';
import Medications from './pages/Medications';
import Documents from './pages/Documents';
import ShareQR from './pages/ShareQR';
import VerifyQR from './pages/VerifyQR';
import Profile from './pages/Profile';
import DataEntry from './pages/DataEntry';
import AdminPatients from './pages/AdminPatients';
import AdminFacilities from './pages/AdminFacilities';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/encounters" element={<Encounters />} />
        <Route path="/encounters/:uuid" element={<EncounterDetail />} />
        <Route path="/lab-results" element={<LabResults />} />
        <Route path="/medications" element={<Medications />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/data-entry" element={<DataEntry />} />
        <Route path="/share" element={<ShareQR />} />
        <Route path="/verify" element={<VerifyQR />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/patients" element={<AdminPatients />} />
        <Route path="/admin/patients/:uuid" element={<EncounterDetail />} />
        <Route path="/admin/facilities" element={<AdminFacilities />} />
        <Route path="/patients" element={<AdminPatients />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
