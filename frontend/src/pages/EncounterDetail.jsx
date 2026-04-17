import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recordsAPI } from '../api/client';

export default function EncounterDetail() {
  const { uuid } = useParams();
  const [encounter, setEncounter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordsAPI.getEncounter(uuid).then((res) => {
      setEncounter(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [uuid]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;
  if (!encounter) return <div className="alert alert-error">Encounter not found.</div>;

  return (
    <div>
      <Link to="/encounters" style={{ fontSize: 13, marginBottom: 16, display: 'inline-block' }}>
        ← Back to all encounters
      </Link>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span className="badge badge-forest" style={{ textTransform: 'capitalize' }}>
            {encounter.encounter_type.replace('_', ' ')}
          </span>
          <span className={`badge ${encounter.status === 'finished' ? 'badge-green' : 'badge-gold'}`} style={{ textTransform: 'capitalize' }}>
            {encounter.status.replace('_', ' ')}
          </span>
        </div>

        <h1>{encounter.chief_complaint || 'Clinical visit'}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginTop: 20 }}>
          <DetailField label="Facility" value={encounter.facility_name || '—'} />
          <DetailField label="Provider" value={encounter.provider_name ? `Dr. ${encounter.provider_name}` : '—'} />
          <DetailField
            label="Date"
            value={new Date(encounter.start_time).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          />
          <DetailField
            label="Time"
            value={new Date(encounter.start_time).toLocaleTimeString('en-GB', {
              hour: '2-digit', minute: '2-digit',
            })}
          />
        </div>

        {encounter.notes && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Clinical Notes
            </div>
            <p style={{ lineHeight: 1.6 }}>{encounter.notes}</p>
          </div>
        )}

        {encounter.diagnosis_codes?.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Diagnosis Codes (ICD-10)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {encounter.diagnosis_codes.map((code, i) => (
                <span key={i} className="badge badge-gold" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vitals and observations */}
      {encounter.observations?.length > 0 && (
        <div className="card mb-3">
          <h3 style={{ marginBottom: 16 }}>Vitals and Observations</h3>
          <div className="grid grid-3">
            {encounter.observations.map((obs) => (
              <div key={obs.uuid} style={{
                padding: 14,
                background: 'var(--cream)',
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 4 }}>
                  {obs.display_name}
                </div>
                <div style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--forest)',
                }}>
                  {obs.value_numeric || obs.value_text}
                  {obs.unit && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--slate)', marginLeft: 4 }}>{obs.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab results */}
      {encounter.lab_results?.length > 0 && (
        <div className="card mb-3">
          <h3 style={{ marginBottom: 16 }}>Laboratory Results</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Result</th>
                <th>Reference Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {encounter.lab_results.map((lab) => (
                <tr key={lab.uuid}>
                  <td style={{ fontWeight: 600 }}>{lab.test_name}</td>
                  <td>
                    <span style={{
                      color: lab.is_abnormal ? 'var(--red)' : 'var(--charcoal)',
                      fontWeight: lab.is_abnormal ? 700 : 400,
                    }}>
                      {lab.result_value} {lab.unit}
                    </span>
                  </td>
                  <td style={{ color: 'var(--slate)' }}>{lab.reference_range}</td>
                  <td>
                    <span className={`badge ${lab.is_abnormal ? 'badge-red' : 'badge-green'}`}>
                      {lab.is_abnormal ? 'Abnormal' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Medications */}
      {encounter.medications?.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Prescribed Medications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {encounter.medications.map((med) => (
              <div key={med.uuid} style={{
                padding: 16,
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600 }}>
                      {med.name}
                    </div>
                    {med.generic_name && (
                      <div style={{ fontSize: 12, color: 'var(--slate)', fontStyle: 'italic', marginTop: 2 }}>
                        {med.generic_name}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${med.is_dispensed ? 'badge-green' : 'badge-gold'}`}>
                    {med.is_dispensed ? 'Dispensed' : 'Prescribed'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 13 }}>
                  <div><span style={{ color: 'var(--slate)' }}>Dose:</span> <strong>{med.dose}</strong></div>
                  <div><span style={{ color: 'var(--slate)' }}>Frequency:</span> <strong>{med.frequency}</strong></div>
                  <div><span style={{ color: 'var(--slate)' }}>Route:</span> <strong style={{ textTransform: 'capitalize' }}>{med.route}</strong></div>
                  {med.duration_days && (
                    <div><span style={{ color: 'var(--slate)' }}>Duration:</span> <strong>{med.duration_days} days</strong></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
