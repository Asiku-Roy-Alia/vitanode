import { useState } from 'react';
import { consentAPI } from '../api/client';

export default function VerifyQR() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    if (!token.trim()) return;

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const tokenValue = extractToken(token.trim());
      const res = await consentAPI.verifyQR(tokenValue);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Token verification failed.');
    } finally {
      setLoading(false);
    }
  }

  function extractToken(input) {
    // Handle both raw tokens and full URLs like https://vitanode.health/qr/TOKEN
    const match = input.match(/\/qr\/([^/?#]+)/);
    return match ? match[1] : input;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>Verify Patient QR</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6, maxWidth: 700 }}>
          Enter or paste the token from a patient's QR code to access their records. Every verification is logged in the immutable audit trail.
        </p>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Enter QR Token</h3>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">QR Token or URL</label>
              <input
                type="text"
                className="form-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token or https://vitanode.health/qr/..."
                autoFocus
                style={{ fontFamily: 'monospace', fontSize: 13 }}
              />
              <div className="form-help">
                You can paste the full URL from a scanned QR code or just the token.
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !token.trim()} style={{ width: '100%' }}>
              {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Verify and Access'}
            </button>
          </form>

          <div style={{
            marginTop: 20,
            padding: 16,
            background: 'var(--cream)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--slate)',
          }}>
            <strong style={{ color: 'var(--charcoal)' }}>Provider responsibilities:</strong>
            <ul style={{ marginTop: 8, paddingLeft: 16, lineHeight: 1.7 }}>
              <li>Only access records needed for clinical care</li>
              <li>Access expires automatically at the token TTL</li>
              <li>Your identity is logged for every view</li>
              <li>Patients receive notification of all QR redemptions</li>
            </ul>
          </div>
        </div>

        <div className="card" style={{
          minHeight: 400,
          background: result ? 'var(--warm-white)' : 'var(--cream)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: result ? 'stretch' : 'center',
          justifyContent: result ? 'flex-start' : 'center',
        }}>
          {!result ? (
            <div style={{ textAlign: 'center', color: 'var(--slate)' }}>
              <div style={{ fontSize: 80, marginBottom: 16, color: 'var(--border-dark)' }}>◈</div>
              <h3 style={{ color: 'var(--slate)' }}>Patient record awaits</h3>
              <p style={{ fontSize: 13, marginTop: 8, maxWidth: 320 }}>
                After verification, the patient's authorized data will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="alert alert-success" style={{ marginBottom: 20 }}>
                ✓ Access granted. Session expires {new Date(result.expires_at).toLocaleString('en-GB', {
                  hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
                })}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  Patient
                </div>
                <h2 style={{ marginBottom: 4 }}>{result.patient_name}</h2>
                <div style={{ fontSize: 12, color: 'var(--slate)', fontFamily: 'monospace' }}>
                  ID: {result.patient_uuid}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Authorized Data Categories
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {result.scope.map((s, i) => (
                    <span key={i} className="badge badge-forest" style={{ textTransform: 'capitalize' }}>
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{
                padding: 16,
                background: 'var(--cream)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--slate)',
              }}>
                <strong style={{ color: 'var(--charcoal)' }}>Next step:</strong>
                <p style={{ marginTop: 6, lineHeight: 1.6 }}>
                  Visit the patient view in your provider portal to see their clinical records. 
                  The consent has been logged in the audit trail.
                </p>
              </div>

              <button
                className="btn btn-outline mt-2"
                onClick={() => { setResult(null); setToken(''); }}
              >
                Verify Another Token
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
