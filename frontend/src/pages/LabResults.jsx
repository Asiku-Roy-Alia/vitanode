import { useEffect, useState } from 'react';
import { recordsAPI } from '../api/client';

export default function LabResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAbnormalOnly, setShowAbnormalOnly] = useState(false);

  useEffect(() => {
    recordsAPI.listLabResults().then((res) => {
      setResults(res.data.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = showAbnormalOnly ? results.filter((r) => r.is_abnormal) : results;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;

  const grouped = filtered.reduce((acc, lab) => {
    if (!acc[lab.test_name]) acc[lab.test_name] = [];
    acc[lab.test_name].push(lab);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>Lab Results</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6 }}>
          All your laboratory test results, grouped by test type.
        </p>
      </div>

      <div className="card mb-3" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
          <div><strong style={{ color: 'var(--forest)' }}>{results.length}</strong> total results</div>
          <div><strong style={{ color: 'var(--red)' }}>{results.filter((r) => r.is_abnormal).length}</strong> flagged abnormal</div>
          <div><strong style={{ color: 'var(--forest)' }}>{Object.keys(grouped).length}</strong> unique tests</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showAbnormalOnly}
            onChange={(e) => setShowAbnormalOnly(e.target.checked)}
          />
          Show abnormal results only
        </label>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 40, marginBottom: 12, color: 'var(--border-dark)' }}>◑</div>
          <h3 style={{ color: 'var(--slate)' }}>No lab results</h3>
          <p style={{ marginTop: 8, fontSize: 13 }}>Results appear here after lab tests at participating facilities.</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([testName, labs]) => {
            const sorted = [...labs].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
            const latest = sorted[0];
            return (
              <div key={testName} className="card mb-2">
                <div className="flex-between mb-2">
                  <div>
                    <h3 style={{ fontSize: 16 }}>{testName}</h3>
                    <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
                      {labs.length} {labs.length === 1 ? 'result' : 'results'} on record
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: 26,
                      fontWeight: 700,
                      color: latest.is_abnormal ? 'var(--red)' : 'var(--forest)',
                    }}>
                      {latest.result_value}
                      <span style={{ fontSize: 13, color: 'var(--slate)', fontWeight: 400, marginLeft: 4 }}>
                        {latest.unit}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--slate)' }}>
                      Latest · {new Date(latest.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <table className="table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Result</th>
                      <th>Reference Range</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((lab) => (
                      <tr key={lab.uuid}>
                        <td style={{ color: 'var(--slate)' }}>
                          {new Date(lab.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ fontWeight: 600, color: lab.is_abnormal ? 'var(--red)' : 'var(--charcoal)' }}>
                          {lab.result_value} {lab.unit}
                        </td>
                        <td style={{ color: 'var(--slate)', fontSize: 12 }}>{lab.reference_range || '—'}</td>
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
            );
          })
      )}
    </div>
  );
}
