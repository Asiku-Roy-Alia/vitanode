import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, patient, logout } = useAuth();
  const navigate = useNavigate();

  const patientNav = [
    { to: '/', label: 'Dashboard', icon: '◉' },
    { to: '/data-entry', label: 'Enter Health Data', icon: '✦' },
    { to: '/encounters', label: 'Encounters', icon: '◐' },
    { to: '/lab-results', label: 'Lab Results', icon: '◑' },
    { to: '/medications', label: 'Medications', icon: '◒' },
    { to: '/documents', label: 'Documents', icon: '◓' },
    { to: '/share', label: 'Share with Provider', icon: '◈' },
    { to: '/profile', label: 'My Profile', icon: '◎' },
  ];

  const providerNav = [
    { to: '/', label: 'Dashboard', icon: '◉' },
    { to: '/verify', label: 'Scan Patient QR', icon: '◈' },
    { to: '/patients', label: 'My Patients', icon: '◐' },
    { to: '/profile', label: 'My Profile', icon: '◎' },
  ];

  const adminNav = [
    { to: '/', label: 'Analytics', icon: '◉' },
    { to: '/admin/patients', label: 'All Patients', icon: '◐' },
    { to: '/admin/facilities', label: 'Facilities', icon: '◑' },
    { to: '/profile', label: 'My Profile', icon: '◎' },
  ];

  let nav = patientNav;
  if (user?.role === 'provider') nav = providerNav;
  if (user?.role === 'sys_admin' || user?.role === 'facility_admin') nav = adminNav;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        background: 'var(--forest-dark)',
        color: 'white',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 22, fontWeight: 700, color: 'var(--forest-dark)',
            }}>V</div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600 }}>
                Vitanode
              </div>
              <div style={{ fontSize: 11, color: 'var(--gold-light)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Your Health, Connected
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                marginBottom: 2,
                borderRadius: 8,
                color: isActive ? 'var(--gold-light)' : 'rgba(255,255,255,0.75)',
                background: isActive ? 'rgba(212, 168, 67, 0.1)' : 'transparent',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                transition: 'all 0.15s',
                borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                paddingLeft: isActive ? 11 : 14,
              })}
            >
              <span style={{ fontSize: 12, opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gold-light)', marginBottom: 12, textTransform: 'capitalize' }}>
            {user?.role?.replace('_', ' ')}
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(192, 57, 43, 0.6)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
