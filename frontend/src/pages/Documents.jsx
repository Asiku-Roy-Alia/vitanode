import { useEffect, useState } from 'react';
import { documentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Documents() {
  const { patient } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    try {
      const res = await documentsAPI.list();
      setDocs(res.data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(uuid) {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      await documentsAPI.delete(uuid);
      loadDocs();
    } catch (err) {
      alert('Failed to delete document.');
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Documents</h1>
          <p style={{ color: 'var(--slate)', marginTop: 6 }}>
            Upload lab reports, prescriptions, and other medical records.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          + Upload Document
        </button>
      </div>

      {showUpload && (
        <UploadForm
          patient={patient}
          onClose={() => setShowUpload(false)}
          onUploaded={loadDocs}
        />
      )}

      {docs.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 40, marginBottom: 12, color: 'var(--border-dark)' }}>◓</div>
          <h3 style={{ color: 'var(--slate)' }}>No documents yet</h3>
          <p style={{ marginTop: 8, fontSize: 13, marginBottom: 20 }}>
            Upload PDFs or images of your lab reports, prescriptions, and other medical records.
          </p>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-3">
          {docs.map((doc) => (
            <div key={doc.uuid} className="card card-hover" style={{ padding: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', gap: 8, marginBottom: 12,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8,
                  background: 'var(--cream)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                  color: 'var(--gold-dark)',
                }}>
                  {doc.mime_type?.includes('pdf') ? '◈' : '◇'}
                </div>
                <span className={`badge ${doc.is_verified ? 'badge-green' : 'badge-gold'}`}>
                  {doc.is_verified ? 'Verified' : 'Self-uploaded'}
                </span>
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                {doc.title || 'Untitled document'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {doc.document_type?.replace('_', ' ')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate-light)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                {(doc.file_size_bytes / 1024).toFixed(1)} KB · {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => downloadDocument(doc.uuid)}
                >
                  View
                </button>
                <button
                  className="btn btn-sm"
                  style={{ color: 'var(--red)' }}
                  onClick={() => handleDelete(doc.uuid)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function downloadDocument(uuid) {
  try {
    const res = await documentsAPI.download(uuid);
    if (res.data.download_url) {
      window.open(res.data.download_url, '_blank');
    }
  } catch (err) {
    alert('Could not download document.');
  }
}

function UploadForm({ patient, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('lab_report');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    if (!patient?.uuid) { setError('Patient profile not loaded yet.'); return; }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient', patient.uuid);
    formData.append('document_type', docType);
    formData.append('title', title || file.name);
    formData.append('description', description);
    formData.append('mime_type', file.type || 'application/octet-stream');

    try {
      await documentsAPI.upload(formData);
      onUploaded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(20, 40, 30, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      zIndex: 100,
    }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 500, width: '100%', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2">Upload Document</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">File</label>
            <input
              type="file"
              className="form-input"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <div className="form-help">PDFs and images up to 10 MB.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Document Type</label>
            <select
              className="form-select"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="lab_report">Lab Report</option>
              <option value="prescription">Prescription</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="referral_letter">Referral Letter</option>
              <option value="imaging">Imaging / Radiology</option>
              <option value="insurance_card">Insurance Card</option>
              <option value="immunization">Immunization Record</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Malaria test result, March 2026"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any notes about this document..."
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
