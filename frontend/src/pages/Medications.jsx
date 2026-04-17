import { useEffect, useState } from 'react';
import { recordsAPI } from '../api/client';

export default function Medications() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    recordsAPI.listMedications().then((res) => {
      setMeds(res.data.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date();
  const isActive = (med) => {
    if (!med.end_date) return true;
    return new Date(med.end_date) >= today;
  };

  const filtered = showActiveOnly ? meds.filter(isActive) : meds;
  const active = meds.filter(isActive);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>Medications</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6 }}>
          Prescriptions and dispensed medications across all encounters.
        </p>
      </div>

      <div className="card mb-3" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
          <div><strong style={{ color: 'var(--forest)' }}>{meds.length}</strong> total prescriptions</div>
          <div><strong style={{ color: 'var(--green)' }}>{active.length}</strong> currently active</div>
          <div><strong style={{ color: 'var(--slate)' }}>{meds.filter((m) => m.is_dispensed).length}</strong> dispensed</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
          />
          Show active only
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 40, marginBottom: 12, color: 'var(--border-dark)' }}>◒</div>
          <h3 style={{ color: 'var(--slate)' }}>No medications</h3>
          <p style={{ marginTop: 8, fontSize: 13 }}>Medication records appear here after prescriptions are issued.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered
            .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
            .map((med) => {
              const active = isActive(med);
              return (
                <div key={med.uuid} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className={`badge ${active ? 'badge-green' : 'badge-slate'}`}>
                          {active ? 'Active' : 'Completed'}
                        </span>
                        <span className={`badge ${med.is_dispensed ? 'badge-gold' : 'badge-forest'}`}>
                          {med.is_dispensed ? 'Dispensed' : 'Prescribed'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 18, fontFamily: 'Fraunces, serif' }}>{med.name}</h3>
                      {med.generic_name && med.generic_name !== med.name && (
                        <div style={{ fontSize: 12, color: 'var(--slate)', fontStyle: 'italic', marginTop: 2 }}>
                          {med.generic_name}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--slate)' }}>
                      {new Date(med.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {med.end_date && ` → ${new Date(med.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 16,
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border)',
                  }}>
                    <Field label="Dose" value={med.dose} />
                    <Field label="Frequency" value={med.frequency} />
                    <Field label="Route" value={med.route} capitalize />
                    {med.duration_days && <Field label="Duration" value={`${med.duration_days} days`} />}
                  </div>

                  {med.prescriber_notes && (
                    <div style={{
                      marginTop: 12,
                      padding: 12,
                      background: 'var(--cream)',
                      borderRadius: 6,
                      fontSize: 13,
                      color: 'var(--slate)',
                      fontStyle: 'italic',
                    }}>
                      “{med.prescriber_notes}”
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, capitalize }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, textTransform: capitalize ? 'capitalize' : 'none' }}>
        {value}
      </div>
    </div>
  );
}
