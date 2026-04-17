import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recordsAPI } from '../api/client';

export default function Encounters() {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    recordsAPI.listEncounters().then((res) => {
      setEncounters(res.data.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? encounters : encounters.filter((e) => e.encounter_type === filter);

  const types = ['all', ...new Set(encounters.map((e) => e.encounter_type))];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>Encounters</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6 }}>
          Your complete visit history across all facilities.
        </p>
      </div>

      <div className="card mb-3" style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="btn btn-sm"
            style={{
              background: filter === t ? 'var(--forest)' : 'transparent',
              color: filter === t ? 'white' : 'var(--charcoal)',
              border: `1px solid ${filter === t ? 'var(--forest)' : 'var(--border-dark)'}`,
              textTransform: 'capitalize',
            }}
          >
            {t === 'all' ? `All (${encounters.length})` : t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 40, marginBottom: 12, color: 'var(--border-dark)' }}>◐</div>
          <h3 style={{ color: 'var(--slate)' }}>No encounters found</h3>
          <p style={{ marginTop: 8, fontSize: 13 }}>
            Encounter records will appear here after visits to participating facilities.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((enc) => (
            <Link
              key={enc.uuid}
              to={`/encounters/${enc.uuid}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="card card-hover" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 250 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <span className="badge badge-forest" style={{ textTransform: 'capitalize' }}>
                        {enc.encounter_type.replace('_', ' ')}
                      </span>
                      <span className={`badge ${enc.status === 'finished' ? 'badge-green' : 'badge-gold'}`} style={{ textTransform: 'capitalize' }}>
                        {enc.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>
                      {enc.chief_complaint || 'Clinical visit'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--slate)' }}>
                      {enc.facility_name}
                      {enc.provider_name && ` · Dr. ${enc.provider_name}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: 'var(--slate)' }}>
                      {new Date(enc.start_time).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--slate-light)', marginTop: 2 }}>
                      {new Date(enc.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
