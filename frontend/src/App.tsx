import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Screener } from './components/Screener';
import { JobMatcher } from './components/JobMatcher';
import { Settings } from './components/Settings';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';

interface CurrentUser {
  username: string;
  isAdmin: boolean;
}

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [userScanCount, setUserScanCount] = useState<number>(0);
  const [userAvgScore, setUserAvgScore] = useState<number>(0);

  // Restore session if user was previously logged in
  useEffect(() => {
    const savedUser = sessionStorage.getItem('current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as CurrentUser;
        setCurrentUser(parsed);
        loadUserStats(parsed.username);
      } catch {
        sessionStorage.removeItem('current_user');
      }
    }

    // Load admin-configured system settings from localStorage
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
    const savedDemo = localStorage.getItem('gemini_demo_mode');

    setApiKey(savedKey);
    setSelectedModel(savedModel);
    setIsDemoMode(savedDemo === null ? true : savedDemo === 'true');
  }, []);

  const loadUserStats = (username: string) => {
    const historyKey = `user_history_${username.toLowerCase()}`;
    const historyStr = localStorage.getItem(historyKey) || '[]';
    try {
      const history = JSON.parse(historyStr);
      setUserScanCount(history.length);
      if (history.length > 0) {
        const avg = Math.round(history.reduce((sum: number, item: any) => sum + item.score, 0) / history.length);
        setUserAvgScore(avg);
      } else {
        setUserAvgScore(0);
      }
    } catch {
      setUserScanCount(0);
    }
  };

  const handleLoginSuccess = (username: string, isAdmin: boolean) => {
    const user: CurrentUser = { username, isAdmin };
    setCurrentUser(user);
    sessionStorage.setItem('current_user', JSON.stringify(user));
    loadUserStats(username);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('current_user');
    setActiveTab('dashboard');
    setUserScanCount(0);
    setUserAvgScore(0);
  };

  const updateApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const updateSelectedModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('gemini_model', model);
  };

  const updateDemoMode = (demo: boolean) => {
    setIsDemoMode(demo);
    localStorage.setItem('gemini_demo_mode', String(demo));
  };

  const handleAnalysisSuccess = (_score: number) => {
    if (!currentUser) return;

    // Reload stats from storage after saving (Screener/Matcher save to localStorage first)
    setTimeout(() => {
      if (currentUser) loadUserStats(currentUser.username);
    }, 100);

    // Also track global total for admin dashboard
    const nextGlobal = parseInt(localStorage.getItem('global_scanned_count') || '0', 10) + 1;
    localStorage.setItem('global_scanned_count', String(nextGlobal));
  };

  // Show Auth screen if not logged in
  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            totalAnalyzed={userScanCount}
            averageScore={userAvgScore}
            selectedModel={selectedModel}
          />
        );
      case 'screener':
        return (
          <Screener
            apiKey={apiKey}
            selectedModel={selectedModel}
            isDemoMode={isDemoMode}
            onAnalysisSuccess={handleAnalysisSuccess}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
          />
        );
      case 'matcher':
        return (
          <JobMatcher
            apiKey={apiKey}
            selectedModel={selectedModel}
            isDemoMode={isDemoMode}
            onAnalysisSuccess={handleAnalysisSuccess}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
          />
        );
      case 'profile':
        return (
          <Profile
            username={currentUser.username}
            isAdmin={currentUser.isAdmin}
          />
        );
      case 'settings':
        return (
          <Settings
            apiKey={apiKey}
            setApiKey={updateApiKey}
            selectedModel={selectedModel}
            setSelectedModel={updateSelectedModel}
            isDemoMode={isDemoMode}
            setIsDemoMode={updateDemoMode}
            currentUser={currentUser}
          />
        );
      default:
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            totalAnalyzed={userScanCount}
            averageScore={userAvgScore}
            selectedModel={selectedModel}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Decorative Glow Overlays */}
      <div style={{
        position: 'fixed',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        top: '-100px',
        right: '-100px',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'fixed',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
        bottom: '-150px',
        left: '200px',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDemoMode={isDemoMode}
        totalAnalyzed={userScanCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="main-content" style={{ zIndex: 1 }}>
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
