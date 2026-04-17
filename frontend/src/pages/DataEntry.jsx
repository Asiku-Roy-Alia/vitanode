import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const DATA_CATEGORIES = [
  {
    id: 'vitals',
    title: 'Vitals',
    icon: '♡',
    fields: [
      { name: 'blood_pressure_systolic', label: 'Blood Pressure (systolic)', unit: 'mmHg', code: '8480-6', type: 'vital_sign' },
      { name: 'blood_pressure_diastolic', label: 'Blood Pressure (diastolic)', unit: 'mmHg', code: '8462-4', type: 'vital_sign' },
      { name: 'heart_rate', label: 'Heart Rate', unit: 'bpm', code: '8867-4', type: 'vital_sign' },
      { name: 'temperature', label: 'Temperature', unit: '°C', code: '8310-5', type: 'vital_sign' },
      { name: 'weight', label: 'Weight', unit: 'kg', code: '29463-7', type: 'vital_sign' },
      { name: 'height', label: 'Height', unit: 'cm', code: '8302-2', type: 'vital_sign' },
      { name: 'blood_glucose', label: 'Blood Glucose', unit: 'mmol/L', code: '2345-7', type: 'vital_sign' },
    ],
  },
  {
    id: 'symptoms',
    title: 'Symptoms',
    icon: '⊕',
    fields: [
      { name: 'symptom_description', label: 'Describe your symptoms', type: 'text' },
      { name: 'symptom_severity', label: 'Severity (1 = mild, 10 = severe)', unit: '/10', type: 'scale' },
      { name: 'symptom_duration', label: 'How long have you had these symptoms?', type: 'text' },
    ],
  },
  {
    id: 'medications',
    title: 'Medications I Take',
    icon: '◒',
    fields: [
      { name: 'med_name', label: 'Medication Name', type: 'text' },
      { name: 'med_dose', label: 'Dose', type: 'text' },
      { name: 'med_frequency', label: 'How often', type: 'text' },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    icon: '◎',
    fields: [
      { name: 'exercise_minutes', label: 'Exercise this week', unit: 'minutes', code: '89555-7', type: 'social_history' },
      { name: 'sleep_hours', label: 'Average sleep per night', unit: 'hours', code: '93832-4', type: 'social_history' },
      { name: 'water_intake', label: 'Water intake today', unit: 'glasses', type: 'social_history' },
      { name: 'mood_score', label: 'Mood (1 = low, 10 = great)', unit: '/10', type: 'social_history' },
    ],
  },
];

export default function DataEntry() {
  const { patient } = useAuth();
  const [activeCategory, setActiveCategory] = useState('vitals');
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  const category = DATA_CATEGORIES.find((c) => c.id === activeCategory);

  function updateValue(fieldName, value) {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  }

  async function handleSave() {
    if (!patient?.uuid) { setMessage('Patient profile not loaded.'); return; }

    const filledFields = category.fields.filter(
      (f) => values[f.name] && values[f.name].toString().trim() !== ''
    );
    if (filledFields.length === 0) {
      setMessage('Please fill in at least one field.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Create a self-reported encounter
      const now = new Date().toISOString();
      const encounterRes = await api.post('/api/v1/encounters/', {
        patient: patient.uuid,
        encounter_type: 'outpatient',
        status: 'finished',
        chief_complaint: `Self-reported ${category.title.toLowerCase()}`,
        notes: `Patient self-reported data entry via Vitanode app.`,
        start_time: now,
        end_time: now,
      });

      const encUuid = encounterRes.data.uuid;

      // Create observations for numeric/vital fields
      for (const field of filledFields) {
        if (field.type === 'text') continue;

        const numVal = parseFloat(values[field.name]);
        if (isNaN(numVal)) continue;

        await api.post('/api/v1/observations/', {
          encounter: encUuid,
          observation_type: field.type || 'vital_sign',
          code: field.code || field.name,
          display_name: field.label,
          value_numeric: numVal,
          unit: field.unit || '',
          status: 'final',
          recorded_at: now,
        });
      }

      setHistory((prev) => [{
        category: category.title,
        fields: filledFields.map((f) => `${f.label}: ${values[f.name]} ${f.unit || ''}`),
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }, ...prev]);

      setValues({});
      setMessage('Data saved successfully to your health record.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>Enter Health Data</h1>
        <p style={{ color: 'var(--slate)', marginTop: 6, maxWidth: 700 }}>
          Record your vitals, symptoms, medications, and lifestyle data. Everything you enter is stored securely in your health wallet and visible to providers you share with.
        </p>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : message.includes('Failed') ? 'alert-error' : 'alert-info'}`}>
          {message}
        </div>
      )}

      {/* Category tabs */}
      <div className="card mb-3" style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {DATA_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setValues({}); setMessage(''); }}
            className="btn"
            style={{
              background: activeCategory === cat.id ? 'var(--forest)' : 'transparent',
              color: activeCategory === cat.id ? 'white' : 'var(--charcoal)',
              border: `1px solid ${activeCategory === cat.id ? 'var(--forest)' : 'var(--border-dark)'}`,
              gap: 6,
            }}
          >
            <span>{cat.icon}</span>
            {cat.title}
          </button>
        ))}
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* Entry form */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{category.icon} {category.title}</h3>

          {category.fields.map((field) => (
            <div className="form-group" key={field.name}>
              <label className="form-label">
                {field.label}
                {field.unit && <span style={{ color: 'var(--slate)', fontWeight: 400 }}> ({field.unit})</span>}
              </label>
              {field.type === 'text' ? (
                <textarea
                  className="form-textarea"
                  value={values[field.name] || ''}
                  onChange={(e) => updateValue(field.name, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  rows={2}
                />
              ) : (
                <input
                  type="number"
                  className="form-input"
                  value={values[field.name] || ''}
                  onChange={(e) => updateValue(field.name, e.target.value)}
                  placeholder="0"
                  step="0.1"
                />
              )}
            </div>
          ))}

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Save to My Health Record'}
          </button>

          <div className="form-help" style={{ marginTop: 12, textAlign: 'center' }}>
            Self-reported data is clearly labelled in your record. It does not replace clinical data from your provider.
          </div>
        </div>

        {/* Recent entries */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Recent Entries This Session</h3>

          {history.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12, color: 'var(--border-dark)' }}>◎</div>
              <p style={{ fontSize: 13 }}>Your entries will appear here as you record them.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((entry, i) => (
                <div key={i} style={{
                  padding: 14,
                  background: 'var(--cream)',
                  borderRadius: 8,
                }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span className="badge badge-green">{entry.category}</span>
                    <span style={{ fontSize: 11, color: 'var(--slate)' }}>{entry.time}</span>
                  </div>
                  {entry.fields.map((f, j) => (
                    <div key={j} style={{ fontSize: 13, color: 'var(--charcoal)', marginBottom: 2 }}>
                      {f}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div style={{
            marginTop: 24,
            padding: 16,
            background: 'rgba(212, 168, 67, 0.08)',
            borderRadius: 8,
            border: '1px solid var(--gold-light)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold-dark)', marginBottom: 6 }}>
              Coming soon: Smart Health Insights
            </div>
            <p style={{ fontSize: 12, color: 'var(--slate)', lineHeight: 1.5 }}>
              AI-powered analytics will track your trends over time and provide personalised health recommendations based on your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
