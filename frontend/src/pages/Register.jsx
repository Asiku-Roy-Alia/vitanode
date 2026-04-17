import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstMessage = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        setError(`${firstKey}: ${firstMessage}`);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--forest)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 26, fontWeight: 700, color: 'var(--gold)',
            }}>V</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, color: 'var(--forest-dark)' }}>
                Vitanode
              </div>
              <div style={{ fontSize: 11, color: 'var(--gold-dark)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Your Health, Connected
              </div>
            </div>
          </div>
          <h2 style={{ marginBottom: 8 }}>Create your health wallet</h2>
          <p style={{ color: 'var(--slate)' }}>
            Take control of your medical records. Free forever for patients.
          </p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.first_name}
                  onChange={(e) => update('first_name', e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                required
                placeholder="Choose a unique username"
              />
              <div className="form-help">Letters, numbers, and dots only. No spaces.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                placeholder="your.email@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={form.phone_number}
                onChange={(e) => update('phone_number', e.target.value)}
                placeholder="+256 7XX XXX XXX"
              />
              <div className="form-help">Encrypted at rest. Used only for account recovery.</div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  minLength={8}
                />
                <div className="form-help">At least 8 characters.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={form.password_confirm}
                  onChange={(e) => update('password_confirm', e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: 12 }}
            >
              {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--slate)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--slate)' }}>
          By creating an account you agree to our Privacy Policy.<br/>
          Your data is encrypted and you own it.
        </div>
      </div>
    </div>
  );
}
