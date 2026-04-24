import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientsAPI, recordsAPI, analyticsAPI } from '../api/client';

export default function Dashboard() {
  const { user, patient } = useAuth();

  if (user?.role === 'patient') return <PatientDashboard patient={patient} user={user} />;
  if (user?.role === 'provider') return <ProviderDashboard user={user} />;
  return <AdminDashboard user={user} />;
}

function PatientDashboard({ patient, user }) {
  const [summary, setSummary] = useState(null);
  const [recentLabs, setRecentLabs] = useState([]);
  const [activeMeds, setActiveMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patient?.uuid) {
      setLoading(false);
      return;
    }
    loadData();
  }, [patient]);

  async function loadData() {
    try {
      const [summaryRes, labsRes, medsRes] = await Promise.all([
        patientsAPI.summary(patient.uuid),
        recordsAPI.listLabResults(),
        recordsAPI.listMedications(),
      ]);
      setSummary(summaryRes.data);
      setRecentLabs((labsRes.data.results || []).slice(0, 5));
      setActiveMeds((medsRes.data.results || []).slice(0, 5));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;
  }

  if (!patient) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <h2>Welcome, {user.first_name}</h2>
        <p style={{ marginTop: 12, color: 'var(--slate)' }}>
          Your patient profile is being set up. Please contact support if this persists.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--gold-dark)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Your Health Wallet
        </div>
        <h1>Hello, {patient.first_name}</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6 }}>
          Here is a summary of your health records.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-4 mb-4">
        <StatCard icon="◐" value={summary?.total_encounters || 0} label="Encounters" href="/encounters" />
        <StatCard icon="◑" value={recentLabs.length} label="Lab Results" href="/lab-results" />
        <StatCard icon="◒" value={activeMeds.length} label="Medications" href="/medications" />
        <StatCard icon="◓" value={summary?.total_documents || 0} label="Documents" href="/documents" />
      </div>

      {/* Primary CTA */}
      <div style={{
        background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)',
        borderRadius: 12,
        padding: 32,
        color: 'white',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ maxWidth: 500 }}>
          <div style={{ fontSize: 12, color: 'var(--gold-light)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Instant Sharing
          </div>
          <h2 style={{ color: 'white', marginBottom: 8 }}>Share your records with any provider</h2>
          <p style={{ opacity: 0.85, fontSize: 14 }}>
            Generate a secure QR code. The provider scans it and gets time-limited access to exactly what you choose.
          </p>
        </div>
        <Link to="/share" className="btn btn-gold btn-lg">
          Generate QR Code →
        </Link>
      </div>

      {/* Recent activity */}
      <div className="grid grid-2">
        <div className="card">
          <div className="flex-between mb-2">
            <h3>Recent Encounters</h3>
            <Link to="/encounters" style={{ fontSize: 13 }}>View all →</Link>
          </div>
          {(summary?.recent_encounters || []).length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div style={{ fontSize: 13 }}>No encounters yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(summary?.recent_encounters || []).slice(0, 5).map((enc, i) => (
                <div key={i} style={{
                  padding: '12px 0',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span className="badge badge-forest">{enc.encounter_type.replace('_', ' ')}</span>
                    <span style={{ fontSize: 12, color: 'var(--slate)' }}>
                      {new Date(enc.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{enc.chief_complaint || 'Visit'}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
                    {enc.facility_name} · {enc.provider_name && `Dr. ${enc.provider_name}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex-between mb-2">
            <h3>Active Medications</h3>
            <Link to="/medications" style={{ fontSize: 13 }}>View all →</Link>
          </div>
          {activeMeds.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div style={{ fontSize: 13 }}>No medications on file.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeMeds.map((med, i) => (
                <div key={i} style={{
                  padding: '12px 0',
                  borderBottom: i < activeMeds.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{med.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>
                    {med.dose} · {med.frequency}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent lab results */}
      <div className="card mt-3">
        <div className="flex-between mb-2">
          <h3>Recent Lab Results</h3>
          <Link to="/lab-results" style={{ fontSize: 13 }}>View all →</Link>
        </div>
        {recentLabs.length === 0 ? (
          <div className="empty-state"><div style={{ fontSize: 13 }}>No lab results yet.</div></div>
        ) : (
          <table className="table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Test</th>
                <th>Result</th>
                <th>Reference Range</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLabs.map((lab) => (
                <tr key={lab.uuid}>
                  <td style={{ fontWeight: 600 }}>{lab.test_name}</td>
                  <td>{lab.result_value} {lab.unit}</td>
                  <td style={{ color: 'var(--slate)' }}>{lab.reference_range}</td>
                  <td style={{ color: 'var(--slate)' }}>
                    {new Date(lab.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span className={`badge ${lab.is_abnormal ? 'badge-red' : 'badge-green'}`}>
                      {lab.is_abnormal ? 'Abnormal' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, href }) {
  const content = (
    <div className="card card-hover" style={{ padding: 20 }}>
      <div style={{ fontSize: 20, color: 'var(--gold)', marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 32,
        fontWeight: 700,
        color: 'var(--forest)',
        letterSpacing: -1,
      }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 2 }}>{label}</div>
    </div>
  );
  return href ? <Link to={href} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

function ProviderDashboard({ user }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--gold-dark)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Provider Portal
        </div>
        <h1>Welcome, Dr. {user.last_name}</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6 }}>
          Scan a patient QR code to access their records.
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)',
        borderRadius: 12,
        padding: 40,
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>◈</div>
        <h2 style={{ color: 'white', marginBottom: 8 }}>Verify a User QR Token</h2>
        <p style={{ opacity: 0.85, fontSize: 14, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
          Enter the token from a user's QR code to view their scoped records. All access is logged in the audit trail.
        </p>
        <Link to="/verify" className="btn btn-gold btn-lg">
          Open QR Verifier →
        </Link>
      </div>

      <div className="grid grid-3 mt-4">
        <InfoCard title="How it works" items={[
          'User generates a QR code in their app',
          'You scan or enter the token',
          'You get scoped, time-limited access',
          'Every view is logged for compliance',
        ]} />
        <InfoCard title="Your permissions" items={[
          'View records shared via QR consent',
          'View records from your facility',
          'Add clinical notes to encounters',
          'Update patient records you created',
        ]} />
        <InfoCard title="User privacy" items={[
          'You only see what the patient shares',
          'Access expires automatically',
          'Users can revoke at any time',
          'Full audit trail of every access',
        ]} />
      </div>
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>{title}</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item, i) => (
          <li key={i} style={{
            fontSize: 13,
            paddingLeft: 20,
            position: 'relative',
            marginBottom: 8,
            color: 'var(--charcoal)',
            lineHeight: 1.5,
          }}>
            <span style={{
              position: 'absolute',
              left: 0,
              top: 7,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--gold)',
            }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.summary().then((res) => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;
  if (!stats) return <div className="alert alert-error">Failed to load analytics.</div>;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--gold-dark)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Admin Dashboard
        </div>
        <h1>Platform Analytics</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6 }}>
          System-wide metrics across all facilities and patients.
        </p>
      </div>

      <div className="grid grid-4 mb-4">
        <StatCard icon="◐" value={stats.total_patients} label="Total Users" />
        <StatCard icon="◑" value={stats.total_encounters} label="Total Encounters" />
        <StatCard icon="◒" value={stats.total_documents} label="Documents" />
        <StatCard icon="◈" value={stats.qr_shares_redeemed} label="QR Shares Used" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="mb-2">Last 30 Days</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <MetricRow label="New user registrations" value={stats.patients_last_30_days} />
            <MetricRow label="New clinical encounters" value={stats.encounters_last_30_days} />
            <MetricRow label="QR codes generated" value={stats.qr_shares_generated} />
            <MetricRow label="QR codes redeemed by providers" value={stats.qr_shares_redeemed} />
          </div>
        </div>

        <div className="card">
          <h3 className="mb-2">Encounters by Type</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(stats.encounters_by_type || []).map((item, i) => {
              const max = Math.max(...stats.encounters_by_type.map((x) => x.count));
              const pct = (item.count / max) * 100;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ textTransform: 'capitalize' }}>{item.encounter_type.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 700, color: 'var(--forest)' }}>{item.count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--cream)', borderRadius: 3 }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, var(--forest), var(--forest-light))',
                      width: `${pct}%`,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <span style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--forest)',
      }}>{value}</span>
    </div>
  );
}
