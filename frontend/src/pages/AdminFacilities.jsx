import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/facilities/').then((res) => {
      setFacilities(res.data.results || res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;

  const typeLabels = {
    hc2: 'Health Centre II',
    hc3: 'Health Centre III',
    hc4: 'Health Centre IV',
    hospital: 'Hospital',
    rrh: 'Regional Referral Hospital',
    nrh: 'National Referral Hospital',
    private: 'Private Clinic',
  };

  return (
    <div>
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Health Facilities</h1>
          <p style={{ color: 'var(--slate)', marginTop: 6 }}>
            {facilities.length} facilities registered on the platform.
          </p>
        </div>
      </div>

      {facilities.length === 0 ? (
        <div className="card empty-state">
          <h3 style={{ color: 'var(--slate)' }}>No facilities registered yet</h3>
        </div>
      ) : (
        <div className="grid grid-2">
          {facilities.map((f) => (
            <div key={f.uuid || f.id} className="card card-hover" style={{ padding: 20 }}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <span className="badge badge-forest">{typeLabels[f.facility_type] || f.facility_type}</span>
                <span className={`badge ${f.is_active ? 'badge-green' : 'badge-red'}`}>
                  {f.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontFamily: 'Fraunces, serif', marginBottom: 4 }}>{f.name}</h3>
              <div style={{ fontSize: 12, color: 'var(--slate)', fontFamily: 'monospace', marginBottom: 12 }}>
                Code: {f.code}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--border)',
                fontSize: 13,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                    District
                  </div>
                  <div style={{ fontWeight: 600 }}>{f.district || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                    Contact
                  </div>
                  <div style={{ fontWeight: 600 }}>{f.contact_phone || f.contact_email || '—'}</div>
                </div>
              </div>
              {f.address && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--slate)' }}>
                  {f.address}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
