import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientsAPI } from '../api/client';

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    patientsAPI.list().then((res) => {
      setPatients(res.data.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = search
    ? patients.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        p.uuid.includes(search)
      )
    : patients;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>All Users</h1>
          <p style={{ color: 'var(--slate)', marginTop: 6 }}>
            {patients.length} users registered across all facilities.
          </p>
        </div>
      </div>

      <div className="card mb-3" style={{ padding: 16 }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name or UUID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <h3 style={{ color: 'var(--slate)' }}>No users match your search</h3>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Facility</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.uuid}>
                  <td style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                  <td>
                    <span className="badge badge-forest">{p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}</span>
                  </td>
                  <td style={{ color: 'var(--slate)' }}>
                    {p.date_of_birth
                      ? new Date(p.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Not set'}
                  </td>
                  <td style={{ color: 'var(--slate)', fontSize: 12 }}>
                    {p.primary_facility || '—'}
                  </td>
                  <td style={{ color: 'var(--slate)', fontSize: 12 }}>
                    {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <Link
                      to={`/admin/patients/${p.uuid}`}
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
