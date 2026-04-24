import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { recordsAPI } from '../api/client';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = {
  forest: '#1B5E3A',
  forestLight: '#2D8B57',
  gold: '#D4A843',
  red: '#C0392B',
  green: '#27AE60',
  slate: '#5A6B7A',
  cream: '#FAF7F0',
};

const PIE_COLORS = [COLORS.forest, COLORS.gold, COLORS.forestLight, COLORS.green, COLORS.red, COLORS.slate];

export default function UserAnalytics() {
  const { patient } = useAuth();
  const [encounters, setEncounters] = useState([]);
  const [labs, setLabs] = useState([]);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [encRes, labRes, medRes] = await Promise.all([
        recordsAPI.listEncounters(),
        recordsAPI.listLabResults(),
        recordsAPI.listMedications(),
      ]);
      setEncounters(encRes.data.results || []);
      setLabs(labRes.data.results || []);
      setMeds(medRes.data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;

  // Compute encounter timeline (encounters per month)
  const encountersByMonth = {};
  encounters.forEach((enc) => {
    const d = new Date(enc.start_time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    encountersByMonth[key] = (encountersByMonth[key] || 0) + 1;
  });
  const timelineData = Object.entries(encountersByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      visits: count,
    }));

  // Encounter types distribution
  const typeCounts = {};
  encounters.forEach((enc) => {
    const t = enc.encounter_type.replace('_', ' ');
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  // Lab results over time (group by test, plot numeric values)
  const labsByTest = {};
  labs.forEach((lab) => {
    if (!labsByTest[lab.test_name]) labsByTest[lab.test_name] = [];
    labsByTest[lab.test_name].push({
      date: new Date(lab.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
      value: lab.result_numeric != null ? parseFloat(lab.result_numeric) : null,
      abnormal: lab.is_abnormal,
      display: lab.result_value,
    });
  });

  // Numeric lab tests with at least one numeric value
  const numericLabTests = Object.entries(labsByTest)
    .filter(([_, results]) => results.some((r) => r.value !== null))
    .map(([name, results]) => ({
      name,
      data: results.filter((r) => r.value !== null).sort((a, b) => new Date(a.date) - new Date(b.date)),
    }));

  // Active vs completed medications
  const today = new Date();
  const activeMeds = meds.filter((m) => !m.end_date || new Date(m.end_date) >= today).length;
  const completedMeds = meds.length - activeMeds;
  const medStatusData = [
    { name: 'Active', value: activeMeds },
    { name: 'Completed', value: completedMeds },
  ];

  // Abnormal vs normal labs
  const abnormalCount = labs.filter((l) => l.is_abnormal).length;
  const normalCount = labs.length - abnormalCount;
  const labStatusData = [
    { name: 'Normal', value: normalCount },
    { name: 'Abnormal', value: abnormalCount },
  ];

  const noData = encounters.length === 0 && labs.length === 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>Health Analytics</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6, maxWidth: 700 }}>
          Visualise your health trends over time. Track visit frequency, lab result trajectories, and medication patterns.
        </p>
      </div>

      {noData ? (
        <div className="card empty-state" style={{ padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--border-dark)' }}>◎</div>
          <h3 style={{ color: 'var(--slate)' }}>Not enough data yet</h3>
          <p style={{ marginTop: 8, fontSize: 13 }}>Analytics will appear once you have clinical encounters, lab results, or medication records.</p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-4 mb-4">
            <MiniStat label="Total Visits" value={encounters.length} color={COLORS.forest} />
            <MiniStat label="Lab Tests" value={labs.length} color={COLORS.gold} />
            <MiniStat label="Abnormal Results" value={abnormalCount} color={abnormalCount > 0 ? COLORS.red : COLORS.green} />
            <MiniStat label="Active Medications" value={activeMeds} color={COLORS.forestLight} />
          </div>

          {/* Visit timeline */}
          {timelineData.length > 1 && (
            <div className="card mb-3">
              <h3 style={{ marginBottom: 20 }}>Visit Frequency Over Time</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                  <XAxis dataKey="month" fontSize={12} tick={{ fill: COLORS.slate }} />
                  <YAxis allowDecimals={false} fontSize={12} tick={{ fill: COLORS.slate }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E8E2D6', fontSize: 13 }}
                  />
                  <Bar dataKey="visits" fill={COLORS.forest} radius={[4, 4, 0, 0]} name="Visits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Two-column: encounter types + lab status */}
          <div className="grid grid-2 mb-3">
            {typeData.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: 20 }}>Visits by Type</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Lab Results Overview</h3>
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div style={{ textAlign: 'center', padding: 16, background: 'var(--cream)', borderRadius: 8 }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, color: COLORS.green }}>{normalCount}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>Normal</div>
                </div>
                <div style={{ textAlign: 'center', padding: 16, background: '#FCEBEA', borderRadius: 8 }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, color: COLORS.red }}>{abnormalCount}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>Flagged Abnormal</div>
                </div>
              </div>

              {medStatusData[0].value + medStatusData[1].value > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Medication Status</div>
                  <div className="grid grid-2" style={{ gap: 12 }}>
                    <div style={{ textAlign: 'center', padding: 12, background: LIGHT_GREEN_CSS, borderRadius: 8 }}>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: COLORS.forest }}>{activeMeds}</div>
                      <div style={{ fontSize: 11, color: 'var(--slate)' }}>Active</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, background: 'var(--cream)', borderRadius: 8 }}>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: COLORS.slate }}>{completedMeds}</div>
                      <div style={{ fontSize: 11, color: 'var(--slate)' }}>Completed</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lab trend lines */}
          {numericLabTests.length > 0 && (
            <div className="card mb-3">
              <h3 style={{ marginBottom: 4 }}>Lab Result Trends</h3>
              <p style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 20 }}>
                Track how your key lab values change over time. Discuss trends with your health worker.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {numericLabTests.slice(0, 6).map((test) => (
                  <div key={test.name}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--forest)' }}>
                      {test.name}
                    </div>
                    {test.data.length > 1 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={test.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                          <XAxis dataKey="date" fontSize={11} tick={{ fill: COLORS.slate }} />
                          <YAxis fontSize={11} tick={{ fill: COLORS.slate }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8E2D6', fontSize: 13 }} />
                          <Line type="monotone" dataKey="value" stroke={COLORS.forest} strokeWidth={2} dot={{ fill: COLORS.gold, r: 4 }} activeDot={{ r: 6 }} name={test.name} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ padding: 16, background: 'var(--cream)', borderRadius: 8, fontSize: 13 }}>
                        <strong>{test.data[0].value}</strong> on {test.data[0].date}. Need more data points for a trend line.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming soon */}
          <div style={{
            padding: 24,
            background: 'rgba(212, 168, 67, 0.08)',
            borderRadius: 12,
            border: '1px solid var(--gold-light)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold-dark)', marginBottom: 8 }}>
              Coming Soon: AI Health Insights
            </div>
            <p style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.6 }}>
              Personalised health recommendations powered by machine learning will analyse your trends over time, flag potential concerns before they become critical, and suggest preventive actions based on your complete health profile. This feature is under active development.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

const LIGHT_GREEN_CSS = '#E8F5E9';

function MiniStat({ label, value, color }) {
  return (
    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700, color, letterSpacing: -1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
