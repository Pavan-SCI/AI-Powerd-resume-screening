import React, { useState } from 'react';
import { Key, ShieldAlert, Check, HelpCircle, User, Shield } from 'lucide-react';

interface SettingsProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  currentUser: { username: string; isAdmin: boolean } | null;
}

export const Settings: React.FC<SettingsProps> = ({
  selectedModel,
  setSelectedModel,
  currentUser
}) => {
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const isAdmin = currentUser?.isAdmin ?? false;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 3000);
  };



  // Standard User Settings View
  if (!isAdmin) {
    return (
      <div className="settings-container">
        <div>
          <h1>Account Settings</h1>
          <p className="subtitle">Manage your ResumeCraft AI account preferences</p>
        </div>

        <div className="settings-dashboard-grid">
          {/* Left Column: Account Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <User size={20} style={{ color: 'var(--primary)' }} /> Account Information
              </h3>

              <div className="settings-grid-2col">
                <div className="settings-info-card">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</span>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentUser?.username ?? '—'}
                  </p>
                </div>

                <div className="settings-info-card">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Role</span>
                  <p style={{ margin: '0.25rem 0 0 0' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Standard Member</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Policy Notices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{
              padding: '1.5rem',
              borderLeft: '4px solid var(--secondary)',
              background: 'rgba(59, 130, 246, 0.02)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              <Shield size={22} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem' }}>AI Configuration</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  AI system configurations (API keys and model selection) are managed by the site administrator. 
                  As a standard member, the AI engine is automatically set up for you — just upload a resume and start analyzing!
                </p>
              </div>
            </div>

            <div className="glass-panel" style={{
              padding: '1.25rem',
              borderLeft: '4px solid var(--success)',
              background: 'rgba(16, 185, 129, 0.03)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center'
            }}>
              <div style={{ color: 'var(--success)' }}>
                <Check size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  System Mode: Live AI Mode (Gemini Powered)
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  The system is powered by the live Gemini AI engine configured by the administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Settings View — Full Control
  return (
    <div className="settings-container">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <h1>System Settings</h1>
          <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>ADMIN</span>
        </div>
        <p className="subtitle">Configure the Gemini AI engine and application-wide preferences</p>
      </div>

      <div className="settings-dashboard-grid">
        {/* Left Column: Config Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* API Key Configuration */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <Key size={20} style={{ color: 'var(--primary)' }} /> Gemini API Configuration
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="apiKeyInput">Gemini API Key</label>
                <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="apiKeyInput"
                    type="text"
                    className="form-input"
                    value="•••••••••••••••••••••••••••• (Configured on Server)"
                    readOnly
                    style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)' }}
                  />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                  * The API Key is securely managed by the backend Python server (<code>backend/.env</code>).
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="modelSelect">Gemini Model</label>
                <select
                  id="modelSelect"
                  className="form-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended — Fast)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Analysis)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                </select>
              </div>

              <div className="settings-flex-wrap" style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  Save Configuration
                </button>
                {saveStatus === 'success' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Check size={16} /> Saved Successfully
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Help Guides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Get API Key Guide */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={18} style={{ color: 'var(--secondary)' }} /> How to get a free Gemini API Key
            </h3>

            <ol style={{
              listStylePosition: 'inside',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}>
              <li>Open <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>Google AI Studio</a></li>
              <li>Log in with any Google / Gmail account.</li>
              <li>Click the green <strong>"Get API key"</strong> button in the top-left sidebar.</li>
              <li>Select <strong>"Create API key in new project"</strong> and copy the generated key.</li>
              <li>Paste it into the <code>backend/.env</code> file as <code>GEMINI_API_KEY</code>.</li>
            </ol>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              alignItems: 'flex-start'
            }}>
              <ShieldAlert size={18} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Privacy:</strong> Your API key is safely managed by the Python backend server. It is never exposed to the frontend client.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
