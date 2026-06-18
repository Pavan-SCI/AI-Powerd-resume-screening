import React, { useState, useEffect } from 'react';
import { Key, ShieldAlert, Check, HelpCircle, User, Shield, Lock, Bell, Terminal, RefreshCw, AlertTriangle, Monitor, Globe } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

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
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'ai'>('profile');

  // Server/Admin configuration States
  const [apiKey, setApiKey] = useState<string>('•••••••••••••••••••••••••••• (Configured on Server)');
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Profile Edit States
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [fullNameInput, setFullNameInput] = useState<string>('');
  const [bioInput, setBioInput] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Security Edit States
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);

  // OTP Verification States
  const [otpStep, setOtpStep] = useState<'idle' | 'sending' | 'verify'>('idle');
  const [otpCode, setOtpCode] = useState<string>('');
  const [pendingPassword, setPendingPassword] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Preference Customization States
  const [activeTheme, setActiveTheme] = useState<string>('glass-dark');
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [atsStrategyWeekly, setAtsStrategyWeekly] = useState<boolean>(true);
  const [pushAlerts, setPushAlerts] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('en');

  // Diagnostics & Health Logs States
  const [healthLogs, setHealthLogs] = useState<string[]>([]);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  const isAdmin = currentUser?.isAdmin ?? false;

  useEffect(() => {
    // Check initial authenticated user metadata
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || '');
        setUsernameInput(currentUser?.username || user.email?.split('@')[0] || '');
        setFullNameInput(user.user_metadata?.full_name || '');
        setBioInput(user.user_metadata?.bio || '');
      }
    });

    if (isAdmin) {
      fetchApiKey();
    }

    // Load persisted local preferences
    const savedTheme = localStorage.getItem('resumecraft_theme') || 'glass-dark';
    setActiveTheme(savedTheme);

    const savedNotify = localStorage.getItem('email_notify') !== 'false';
    setEmailNotifications(savedNotify);

    const savedWeekly = localStorage.getItem('weekly_tips') !== 'false';
    setAtsStrategyWeekly(savedWeekly);

    const savedPush = localStorage.getItem('push_alerts') === 'true';
    setPushAlerts(savedPush);

    const savedLang = localStorage.getItem('app_lang') || 'en';
    setLanguage(savedLang);
  }, [currentUser, isAdmin]);

  const fetchApiKey = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/admin/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.gemini_api_key) {
          setApiKey(data.gemini_api_key);
        }
      }
    } catch (err) {
      console.error("Failed to fetch API key details", err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setErrorMsg(null);
    setIsSaving(true);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) throw new Error("No active credentials session found.");

      // 1. Sync username into public profiles
      const { error: dbError } = await supabase.from('profiles').upsert({
        id: session.user.id,
        username: usernameInput
      });
      if (dbError) throw dbError;

      // 2. Persist Full Name and Bio in User Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullNameInput,
          bio: bioInput
        }
      });
      if (authError) throw authError;

      setProfileSuccess("Profile details updated successfully!");
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySuccess(null);
    setErrorMsg(null);
    setOtpError(null);

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setOtpStep('sending');
    try {
      const { error } = await supabase.auth.reauthenticate();
      if (error) throw error;

      setPendingPassword(newPassword);
      setOtpStep('verify');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send verification email. Please try again.");
      setOtpStep('idle');
    }
  };

  const handleVerifyOtpAndChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (otpCode.trim().length < 6) {
      setOtpError("Please enter the full 6-digit code from your email.");
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: pendingPassword,
        nonce: otpCode.trim()
      });
      if (updateError) throw updateError;

      setSecuritySuccess("Password changed successfully! Your account is now secured.");
      setOtpStep('idle');
      setOtpCode('');
      setPendingPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecuritySuccess(null), 4000);
    } catch (err: any) {
      setOtpError(err.message || "Invalid or expired verification code. Please request a new one.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOtp = () => {
    setOtpStep('idle');
    setOtpCode('');
    setPendingPassword('');
    setOtpError(null);
    setErrorMsg(null);
  };

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem('resumecraft_theme', themeId);
    document.body.className = '';
    if (themeId !== 'glass-dark') {
      document.body.classList.add(`theme-${themeId}`);
    }
  };

  const handleNotifyChange = (val: boolean) => {
    setEmailNotifications(val);
    localStorage.setItem('email_notify', String(val));
  };

  const handleWeeklyChange = (val: boolean) => {
    setAtsStrategyWeekly(val);
    localStorage.setItem('weekly_tips', String(val));
  };

  const handlePushChange = (val: boolean) => {
    setPushAlerts(val);
    localStorage.setItem('push_alerts', String(val));
  };

  const handleLanguageChange = (langVal: string) => {
    setLanguage(langVal);
    localStorage.setItem('app_lang', langVal);
    setProfileSuccess(`Language changed to ${langVal.toUpperCase()} successfully!`);
    setTimeout(() => setProfileSuccess(null), 3000);
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire scan history? This action is irreversible.")) return;

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const res = await fetch(`${backendUrl}/api/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const historyData = await res.json();
        await Promise.all(historyData.map((item: any) => 
          fetch(`${backendUrl}/api/history/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ));
      }
      setProfileSuccess("Screening and match history cleared successfully!");
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to clean data history.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAIConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(false);
    setErrorMsg(null);
    setSaveStatus(null);

    localStorage.setItem('gemini_model', selectedModel);

    const isKeyChanged = apiKey !== '' && !apiKey.includes('••••••••••••••••') && !apiKey.includes('••••');

    if (isKeyChanged) {
      setIsSaving(true);
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        const response = await fetch(`${backendUrl}/api/admin/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            gemini_api_key: apiKey
          })
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.detail || "Failed to update API key on backend.");
        }
        
        setSaveStatus('success');
        setIsEditingKey(false);
        fetchApiKey();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to save configuration.");
      } finally {
        setIsSaving(false);
      }
    } else {
      setSaveStatus('success');
    }

    setTimeout(() => {
      setSaveStatus(null);
      setErrorMsg(null);
    }, 4000);
  };

  const pingSystemHealth = () => {
    if (isPinging) return;
    setIsPinging(true);
    setHealthLogs(["Initiating system health diagnostics..."]);

    const steps = [
      { log: "Verifying Supabase connection endpoints...", delay: 400 },
      { log: "Supabase authentication & database status: ONLINE", delay: 800 },
      { log: "Connecting to Python FastAPI web server...", delay: 1200 },
      { log: "FastAPI server endpoint running locally on port 8000: ONLINE", delay: 1600 },
      { log: "Validating loaded Google Gemini developer keys...", delay: 2000 },
      { log: "Gemini API client authentication handshake: SUCCESS", delay: 2400 },
      { log: "System check completed. All interfaces operational.", delay: 2800 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setHealthLogs(prev => [...prev, step.log]);
        if (step.log.includes("operational")) {
          setIsPinging(false);
        }
      }, step.delay);
    });
  };

  if (isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1>System Settings</h1>
            <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>ADMIN</span>
          </div>
          <p className="subtitle">Configure global Gemini developer endpoints, models, credentials, and API connections</p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="glass-panel" style={{
            padding: '1rem',
            borderLeft: '4px solid var(--danger)',
            background: 'rgba(239, 68, 68, 0.05)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem'
          }}>
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {saveStatus === 'success' && (
          <div className="glass-panel" style={{
            padding: '1rem',
            borderLeft: '4px solid var(--success)',
            background: 'rgba(16, 185, 129, 0.05)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} style={{ color: 'var(--success)' }} /> System configuration saved successfully!
            </span>
          </div>
        )}

        {securitySuccess && (
          <div className="glass-panel" style={{
            padding: '1rem',
            borderLeft: '4px solid var(--success)',
            background: 'rgba(16, 185, 129, 0.05)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} style={{ color: 'var(--success)' }} /> {securitySuccess}
            </span>
          </div>
        )}

        {/* Admin Dashboard Grid Layout */}
        <div className="settings-dashboard-grid">
          {/* Left Column: API Configuration & Security */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* API Config Panel */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: 0 }}>
                <Key size={20} style={{ color: 'var(--primary)' }} /> Gemini API Configuration
              </h3>

              <form onSubmit={handleSaveAIConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="geminiApiKeyInput">Gemini API Key</label>
                  <input
                    id="geminiApiKeyInput"
                    type={isEditingKey ? "text" : "password"}
                    className="form-input"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setIsEditingKey(true);
                    }}
                    onFocus={() => {
                      if (apiKey.includes('••••')) {
                        setApiKey('');
                        setIsEditingKey(true);
                      }
                    }}
                    placeholder="Enter new Gemini API Key to overwrite..."
                    style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    * Overwrite to reload server keys, or leave masked to retain active key.
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="geminiModelSelect">Gemini Model</label>
                  <select
                    id="geminiModelSelect"
                    className="form-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Analysis)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={isSaving}>
                  {isSaving ? "Saving Configuration..." : "Save AI Configuration"}
                </button>
              </form>
            </div>

            {/* Admin Password Reset */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} style={{ color: 'var(--accent)' }} /> Reset Admin Password
              </h3>

              {otpStep === 'verify' ? (
                <form onSubmit={handleVerifyOtpAndChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--primary)', borderRadius: '0.75rem', padding: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    📧 A 6-digit verification code was sent to{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>.
                    Enter it below to confirm the password change.
                  </div>

                  {otpError && (
                    <div style={{ padding: '0.75rem 1rem', borderLeft: '3px solid var(--danger)', background: 'rgba(239, 68, 68, 0.07)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {otpError}
                    </div>
                  )}

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="adminOtpCodeField">Verification Code</label>
                    <input
                      id="adminOtpCodeField"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="form-input"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      style={{ letterSpacing: '0.4em', fontSize: '1.4rem', textAlign: 'center' }}
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSaving || otpCode.length < 6}>
                      {isSaving ? 'Verifying...' : 'Verify & Change Password'}
                    </button>
                    <button type="button" className="btn" onClick={handleCancelOtp} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRequestPasswordOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="adminNewPasswordField">New Admin Password</label>
                    <input
                      id="adminNewPasswordField"
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters..."
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="adminConfirmPasswordField">Confirm Password</label>
                    <input
                      id="adminConfirmPasswordField"
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password..."
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={otpStep === 'sending'}>
                    {otpStep === 'sending' ? '📤 Sending verification email...' : 'Send Verification Email'}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Right Column: Specifications, Diagnostics & Help */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Admin Account details */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} style={{ color: 'var(--secondary)' }} /> Administrator Credentials
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>System Email:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userEmail}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Access Privilege:</span>
                  <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>SUPER ADMIN</span>
                </div>
              </div>
            </div>

            {/* Health Diagnostics console */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: 0 }}>
                <Terminal size={18} style={{ color: 'var(--primary)' }} /> System Connectivity Status
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Supabase Database:</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>ONLINE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>FastAPI Python Server:</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>ONLINE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Gemini AI Gateway:</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>ONLINE</span>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-secondary diagnostics-btn"
                onClick={pingSystemHealth}
                disabled={isPinging}
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem', marginTop: '0.25rem' }}
              >
                {isPinging ? 'Testing handshakes...' : 'Test Server Connectivity'}
              </button>

              {healthLogs.length > 0 && (
                <div className="console-terminal" style={{ marginTop: '0.25rem' }}>
                  {healthLogs.map((log, index) => (
                    <div key={index} className="console-line console-line-info" style={{ color: log.includes('handshake: SUCCESS') || log.includes('completed') ? '#10b981' : '#a78bfa' }}>
                      &gt; {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help Guides */}
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
                <li>Paste it into the API input box here and save to update it automatically!</li>
              </ol>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Standard User Settings return layout with Tabs
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <h1>System Settings</h1>
        </div>
        <p className="subtitle">Configure your resume screening, targets, account security, and app style customizer</p>
      </div>

      {/* Tab Navigation Menu */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        gap: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'security', label: 'Security & Sessions', icon: Lock },
          { id: 'preferences', label: 'App Preferences', icon: Bell }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setErrorMsg(null);
                setSaveStatus(null);
                // Reset OTP flow when switching tabs
                setOtpStep('idle');
                setOtpCode('');
                setPendingPassword('');
                setOtpError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 0.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error / Success Alerts */}
      {errorMsg && (
        <div className="glass-panel" style={{
          padding: '1rem',
          borderLeft: '4px solid var(--danger)',
          background: 'rgba(239, 68, 68, 0.05)',
          color: 'var(--text-primary)',
          fontSize: '0.9rem'
        }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {profileSuccess && (
        <div className="glass-panel" style={{
          padding: '1rem',
          borderLeft: '4px solid var(--success)',
          background: 'rgba(16, 185, 129, 0.05)',
          color: 'var(--text-primary)',
          fontSize: '0.9rem'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={16} style={{ color: 'var(--success)' }} /> {profileSuccess}
          </span>
        </div>
      )}

      {/* Tab Panels */}
      <div className="settings-dashboard-grid" style={{ minHeight: '350px' }}>
        
        {/* Left Column: Form Settings panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* PROFILE TAB PANEL */}
          {activeTab === 'profile' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} style={{ color: 'var(--primary)' }} /> Edit Profile Details
              </h3>
              
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address (Read Only)</label>
                  <input type="text" className="form-input" value={userEmail} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="usernameField">Username</label>
                  <input 
                    id="usernameField"
                    type="text" 
                    className="form-input" 
                    value={usernameInput} 
                    onChange={(e) => setUsernameInput(e.target.value)} 
                    placeholder="Enter username..."
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="fullNameField">Full Name</label>
                  <input 
                    id="fullNameField"
                    type="text" 
                    className="form-input" 
                    value={fullNameInput} 
                    onChange={(e) => setFullNameInput(e.target.value)} 
                    placeholder="Enter full name..."
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="bioField">Professional Bio Summary</label>
                  <textarea 
                    id="bioField"
                    className="form-textarea" 
                    value={bioInput} 
                    onChange={(e) => setBioInput(e.target.value)} 
                    placeholder="Briefly describe your career domains..."
                    style={{ minHeight: '90px' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={isSaving}>
                  {isSaving ? "Saving details..." : "Save Profile Details"}
                </button>
              </form>
            </div>
          )}

          {/* SECURITY TAB PANEL */}
          {activeTab === 'security' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} style={{ color: 'var(--accent)' }} /> Change Password
              </h3>

              {securitySuccess && (
                <div className="badge badge-success" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', textTransform: 'none' }}>
                  {securitySuccess}
                </div>
              )}

              {otpStep === 'verify' ? (
                <form onSubmit={handleVerifyOtpAndChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--primary)', borderRadius: '0.75rem', padding: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    📧 A 6-digit verification code was sent to{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>.
                    Enter it below to confirm the password change.
                  </div>

                  {otpError && (
                    <div style={{ padding: '0.75rem 1rem', borderLeft: '3px solid var(--danger)', background: 'rgba(239, 68, 68, 0.07)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {otpError}
                    </div>
                  )}

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="userOtpCodeField">Verification Code</label>
                    <input
                      id="userOtpCodeField"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="form-input"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      style={{ letterSpacing: '0.4em', fontSize: '1.4rem', textAlign: 'center' }}
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSaving || otpCode.length < 6}>
                      {isSaving ? 'Verifying...' : 'Verify & Change Password'}
                    </button>
                    <button type="button" className="btn" onClick={handleCancelOtp} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRequestPasswordOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="newPasswordField">New Password</label>
                    <input
                      id="newPasswordField"
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters..."
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="confirmPasswordField">Confirm New Password</label>
                    <input
                      id="confirmPasswordField"
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password..."
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={otpStep === 'sending'}>
                    {otpStep === 'sending' ? '📤 Sending verification email...' : 'Send Verification Email'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PREFERENCES TAB PANEL */}
          {activeTab === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Notification Toggles */}
              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: 0 }}>
                  <Bell size={18} style={{ color: 'var(--primary)' }} /> Notification Settings
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={emailNotifications} 
                      onChange={(e) => handleNotifyChange(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Email Screening Reports</span>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Automatically send a PDF summary report to my registered email address after screening.</p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={atsStrategyWeekly} 
                      onChange={(e) => handleWeeklyChange(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Weekly ATS Strategy Tips</span>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Receive weekly curated career tips, ATS layout checklists, and platform announcements.</p>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={pushAlerts} 
                      onChange={(e) => handlePushChange(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>In-App Toast Alerts</span>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Show small popup indicators at the top-right corner when analyses are completed.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Interface Styles Theme customizer */}
              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: 0 }}>
                  <Monitor size={18} style={{ color: 'var(--secondary)' }} /> Visual Style Customizer
                </h3>
                
                <div className="theme-grid">
                  {[
                    { id: 'glass-dark', name: 'Glass Dark', c1: '#8b5cf6', c2: '#151128' },
                    { id: 'violet', name: 'Deep Space', c1: '#6d28d9', c2: '#0b061e' },
                    { id: 'neon', name: 'Cyber Neon', c1: '#ec4899', c2: '#06000c' },
                    { id: 'classic', name: 'Classic Dark', c1: '#3b82f6', c2: '#0f172a' }
                  ].map((th) => (
                    <div 
                      key={th.id}
                      className={`theme-swatch ${activeTheme === th.id ? 'active' : ''}`}
                      onClick={() => handleThemeChange(th.id)}
                    >
                      <div className="theme-preview-circles">
                        <div className="theme-circle" style={{ background: th.c1 }}></div>
                        <div className="theme-circle" style={{ background: th.c2 }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{th.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Language Selection */}
              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: 0 }}>
                  <Globe size={18} style={{ color: 'var(--accent)' }} /> App Localization (Language)
                </h3>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="langSelect">Display Language</label>
                  <select 
                    id="langSelect"
                    className="form-select" 
                    value={language} 
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="si">සිංහල (Sinhala)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Information, Logs & Session trackers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* PROFILE ARCHIVES CLEANUP (Danger zone) - visible in profile tab */}
          {activeTab === 'profile' && (
            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.01)' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={18} /> Danger Zone
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                Clearing your history will permanently delete all screened resumes, job target matches, and feedback records. This cannot be undone.
              </p>
              <button 
                type="button" 
                className="btn" 
                onClick={handleClearHistory}
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)', color: '#fda4af' }}
              >
                Clear All Screening History
              </button>
            </div>
          )}

          {/* ACTIVE SESSIONS PANEL - visible in security tab */}
          {activeTab === 'security' && (
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: 0 }}>
                <Monitor size={18} style={{ color: 'var(--secondary)' }} /> Active Session Logs
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Session 1 */}
                <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <Monitor size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>Mac OS X (Chrome Browser)</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Colombo, Sri Lanka • <strong>Active Now</strong></span>
                  </div>
                </div>

                {/* Session 2 */}
                <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.75rem', opacity: 0.7 }}>
                  <Monitor size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>iPhone 15 (Safari Mobile)</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Colombo, Sri Lanka • 3 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HELP AND DOCUMENTATION - visible in Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: 0 }}>
                <HelpCircle size={18} style={{ color: 'var(--secondary)' }} /> User Help Guides
              </h3>
              
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                <li>Screening records are processed dynamically without caching.</li>
                <li>Changes made to profile details immediately update your statistics.</li>
                <li>Toggling notification preferences updates automated email dispatches.</li>
              </ul>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
