import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consentAPI } from '../api/client';

const SCOPE_OPTIONS = [
  { value: 'encounters', label: 'Clinical Encounters', desc: 'Visit history, diagnoses, chief complaints' },
  { value: 'lab_results', label: 'Laboratory Results', desc: 'All lab tests and values' },
  { value: 'medications', label: 'Medications', desc: 'Prescriptions and dispensed drugs' },
  { value: 'documents', label: 'Documents', desc: 'Uploaded PDFs and images' },
  { value: 'full', label: 'Full Record Access', desc: 'Everything above in one consent' },
];

const TTL_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes (recommended)' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 240, label: '4 hours' },
  { value: 1440, label: '24 hours (maximum)' },
];

export default function ShareQR() {
  const { patient } = useAuth();
  const [scope, setScope] = useState(['encounters', 'lab_results', 'medications']);
  const [ttl, setTtl] = useState(10);
  const [qrData, setQrData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [consents, setConsents] = useState([]);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    loadConsents();
  }, []);

  useEffect(() => {
    if (!qrData) {
      setCountdown(null);
      return;
    }
    const expires = new Date(qrData.expires_at).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData]);

  async function loadConsents() {
    try {
      const res = await consentAPI.list();
      setConsents(res.data.results || []);
    } catch (err) { console.error(err); }
  }

  function toggleScope(value) {
    if (value === 'full') {
      setScope(['full']);
      return;
    }
    setScope((prev) => {
      const filtered = prev.filter((s) => s !== 'full');
      if (filtered.includes(value)) return filtered.filter((s) => s !== value);
      return [...filtered, value];
    });
  }

  async function handleGenerate() {
    if (!patient?.uuid) { setError('Profile not loaded.'); return; }
    if (scope.length === 0) { setError('Select at least one data category.'); return; }

    setError('');
    setGenerating(true);
    try {
      const res = await consentAPI.generateQR(patient.uuid, { scope, ttl_minutes: ttl });
      setQrData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate QR code.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(uuid) {
    if (!window.confirm('Revoke this consent? The provider will lose access immediately.')) return;
    try {
      await consentAPI.revoke(uuid);
      loadConsents();
    } catch (err) {
      alert('Failed to revoke consent.');
    }
  }

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>Share Your Records</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6, maxWidth: 700 }}>
          Generate a QR code for a provider to scan. They will get time-limited access to exactly the data you choose. You can revoke access anytime.
        </p>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* Left: form */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Configure Your Share</h3>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">What to share</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {SCOPE_OPTIONS.map((opt) => {
                const isChecked = scope.includes(opt.value);
                const isDisabled = opt.value !== 'full' && scope.includes('full');
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: 12,
                      border: `1px solid ${isChecked ? 'var(--forest)' : 'var(--border)'}`,
                      borderRadius: 8,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      background: isChecked ? 'rgba(27, 94, 58, 0.04)' : 'transparent',
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => toggleScope(opt.value)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>{opt.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Access duration</label>
            <select className="form-select" value={ttl} onChange={(e) => setTtl(Number(e.target.value))}>
              {TTL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="form-help">
              Shorter is safer. The QR becomes invalid after this period or once a provider uses it.
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleGenerate} disabled={generating}>
            {generating ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Generate QR Code'}
          </button>
        </div>

        {/* Right: QR output */}
        <div className="card" style={{
          background: qrData ? 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)' : 'var(--warm-white)',
          color: qrData ? 'white' : 'inherit',
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          {!qrData ? (
            <div style={{ color: 'var(--slate)' }}>
              <div style={{ fontSize: 80, marginBottom: 16, color: 'var(--border-dark)' }}>◈</div>
              <h3 style={{ color: 'var(--slate)' }}>Your QR will appear here</h3>
              <p style={{ fontSize: 13, marginTop: 8, maxWidth: 320 }}>
                Choose what to share and for how long, then tap Generate QR Code.
              </p>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 12,
                color: 'var(--gold-light)',
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: 20,
              }}>
                Show this to your provider
              </div>

              <div style={{
                background: 'white',
                padding: 20,
                borderRadius: 12,
                boxShadow: 'var(--shadow-lg)',
              }}>
                <img
                  src={`data:image/png;base64,${qrData.qr_image_base64}`}
                  alt="QR Code"
                  style={{ width: 220, height: 220, display: 'block' }}
                />
              </div>

              <div style={{
                marginTop: 24,
                fontFamily: 'Fraunces, serif',
                fontSize: 36,
                fontWeight: 700,
                color: countdown < 60 ? 'var(--gold-light)' : 'white',
                letterSpacing: -1,
              }}>
                {countdown !== null ? formatCountdown(countdown) : '--:--'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: -2 }}>
                expires in
              </div>

              <div style={{ marginTop: 20, fontSize: 12, opacity: 0.75 }}>
                Sharing: {qrData.scope.join(', ')}
              </div>

              <button
                className="btn btn-gold"
                style={{ marginTop: 20 }}
                onClick={() => setQrData(null)}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active consents */}
      {consents.filter((c) => c.is_active).length > 0 && (
        <div className="card mt-4">
          <h3 style={{ marginBottom: 16 }}>Active Consent Grants</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Granted To</th>
                <th>Scope</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {consents.filter((c) => c.is_active).map((consent) => (
                <tr key={consent.uuid}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {consent.granted_to_provider ? `Provider ${String(consent.granted_to_provider).slice(0, 8)}...` : 'Facility'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(consent.scope || []).map((s, i) => (
                        <span key={i} className="badge badge-forest" style={{ fontSize: 10 }}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: 'var(--slate)', fontSize: 12 }}>
                    {new Date(consent.expires_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className="badge badge-green">Active</span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleRevoke(consent.uuid)}>
                      Revoke
                    </button>
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
