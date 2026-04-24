import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--cream)',
    }}>
      {/* Left: hero panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 60%, var(--forest-light) 100%)',
        color: 'white',
        padding: '60px 50px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative pattern */}
        <div style={{
          position: 'absolute',
          top: -100, right: -100,
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -150, left: -100,
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,139,87,0.2) 0%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 26, fontWeight: 700, color: 'var(--forest-dark)',
            }}>V</div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600 }}>
                Vitanode
              </div>
              <div style={{ fontSize: 11, color: 'var(--gold-light)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Your Health, Connected
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
          <h1 style={{
            fontSize: 42,
            color: 'white',
            lineHeight: 1.15,
            marginBottom: 20,
          }}>
            Your health records, <em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>your</em> control.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.85, marginBottom: 32 }}>
            Access your complete medical history anywhere. Share it with any provider in seconds using a secure QR code. Works offline for rural areas. Built for every Ugandan.
          </p>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { num: '25+', label: 'Users enrolled' },
              { num: '5', label: 'Health facilities' },
              { num: '131', label: 'Clinical encounters' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'var(--gold-light)',
                }}>{s.num}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: 12, opacity: 0.6 }}>
          TavekNode Technologies Ltd.
        </div>
      </div>

      {/* Right: login form */}
      <div style={{
        width: 480,
        padding: '60px 50px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
          <h2 style={{ marginBottom: 8 }}>Welcome back</h2>
          <p style={{ color: 'var(--slate)', marginBottom: 32 }}>
            Sign in to access your health records.
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="your.username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 32, padding: 16, background: 'var(--cream)', borderRadius: 8, fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--forest)' }}>Demo credentials</div>
            <div style={{ color: 'var(--slate)', lineHeight: 1.7 }}>
              Admin: <code>admin / admin1234</code><br/>
              Provider: <code>dr.mukasa / demo1234</code>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--slate)' }}>
            New to Vitanode? <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
