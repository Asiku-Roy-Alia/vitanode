import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, patientsAPI, fhirAPI } from '../api/client';

export default function Profile() {
  const { user, patient, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user]);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      await authAPI.updateProfile(form);
      await refreshProfile();
      setEditing(false);
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!patient?.uuid) return;
    try {
      const res = await fhirAPI.exportPatient(patient.uuid);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myhealth-export-${patient.first_name}-${patient.last_name}-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed.');
    }
  }

  if (!user) return null;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>My Profile</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6 }}>
          Manage your account and export your data.
        </p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card mb-3">
        <div className="flex-between mb-3">
          <h3>Account Information</h3>
          {!editing ? (
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-2">
          <ProfileField
            label="First Name"
            value={editing ? form.first_name : user.first_name}
            editing={editing}
            onChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
          />
          <ProfileField
            label="Last Name"
            value={editing ? form.last_name : user.last_name}
            editing={editing}
            onChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
          />
          <ProfileField
            label="Email"
            value={editing ? form.email : user.email}
            editing={editing}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            type="email"
          />
          <ProfileField
            label="Phone Number"
            value={editing ? form.phone_number : user.phone_number}
            editing={editing}
            onChange={(v) => setForm((f) => ({ ...f, phone_number: v }))}
            type="tel"
          />
        </div>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <ReadOnlyField label="Username" value={user.username} mono />
          <ReadOnlyField label="Role" value={user.role} capitalize />
          <ReadOnlyField label="User UUID" value={user.uuid} mono />
          <ReadOnlyField label="Phone Verified" value={user.phone_verified ? 'Yes' : 'No'} />
        </div>
      </div>

      {patient && (
        <div className="card mb-3">
          <h3 className="mb-2">Health Profile</h3>
          <div className="grid grid-3">
            <ReadOnlyField label="Patient UUID" value={patient.uuid} mono />
            <ReadOnlyField label="Date of Birth" value={patient.date_of_birth || 'Not set'} />
            <ReadOnlyField label="Gender" value={patient.gender} />
          </div>
          <div style={{ marginTop: 16, padding: 16, background: 'var(--cream)', borderRadius: 8, fontSize: 12, color: 'var(--slate)' }}>
            <strong style={{ color: 'var(--charcoal)' }}>Privacy note:</strong> Your phone number and address are encrypted at rest. Your National ID is stored only as a salted hash and is never retrievable in plaintext.
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="mb-2">Data Export and Portability</h3>
        <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 16, lineHeight: 1.6 }}>
          Under Uganda's Data Protection and Privacy Act, you have the right to a copy of all your data. 
          Export everything in FHIR format, a standard format used by hospital systems worldwide.
        </p>
        <button className="btn btn-gold" onClick={handleExport} disabled={!patient?.uuid}>
          ⬇ Export My Full Record as FHIR Bundle
        </button>
      </div>
    </div>
  );
}

function ProfileField({ label, value, editing, onChange, type = 'text' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {editing ? (
        <input
          type={type}
          className="form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div style={{ fontSize: 14, fontWeight: 600 }}>{value || '—'}</div>
      )}
    </div>
  );
}

function ReadOnlyField({ label, value, mono, capitalize }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 12,
        fontFamily: mono ? 'monospace' : 'inherit',
        fontWeight: mono ? 400 : 600,
        textTransform: capitalize ? 'capitalize' : 'none',
        color: mono ? 'var(--slate)' : 'var(--charcoal)',
        wordBreak: 'break-all',
      }}>
        {value || '—'}
      </div>
    </div>
  );
}
