import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Screener } from './components/Screener';
import { JobMatcher } from './components/JobMatcher';
import { Settings } from './components/Settings';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { Menu } from 'lucide-react';

import { supabase } from './utils/supabaseClient';

interface CurrentUser {
  username: string;
  isAdmin: boolean;
}

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [userScanCount, setUserScanCount] = useState<number>(0);
  const [userAvgScore, setUserAvgScore] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth > 1024 : true
  );

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
        loadUserStats(session.access_token);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
        loadUserStats(session.access_token);
      } else {
        setCurrentUser(null);
        setUserScanCount(0);
        setUserAvgScore(0);
      }
    });

    const savedModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';

    setSelectedModel(savedModel);

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      const { data } = await supabase.from('profiles').select('username').eq('id', userId).single();
      const isAdmin = email?.toLowerCase() === 'admin@resumecraft.local';
      setCurrentUser({ username: data?.username || email?.split('@')[0] || 'User', isAdmin });
    } catch {
      setCurrentUser({ username: email?.split('@')[0] || 'User', isAdmin: false });
    }
  };

  const loadUserStats = async (token: string) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const history = await response.json();
        setUserScanCount(history.length);
        if (history.length > 0) {
          const avg = Math.round(history.reduce((sum: number, item: any) => sum + item.score, 0) / history.length);
          setUserAvgScore(avg);
        } else {
          setUserAvgScore(0);
        }
      }
    } catch {
      setUserScanCount(0);
      setUserAvgScore(0);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };


  const updateSelectedModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('gemini_model', model);
  };

  const handleAnalysisSuccess = async (_score: number) => {
    if (!currentUser) return;
    const session = (await supabase.auth.getSession()).data.session;
    if (session) {
      setTimeout(() => loadUserStats(session.access_token), 500);
    }
  };

  if (!currentUser) {
    return <Auth />;
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
            selectedModel={selectedModel}
            onAnalysisSuccess={handleAnalysisSuccess}
          />
        );
      case 'matcher':
        return (
          <JobMatcher
            selectedModel={selectedModel}
            onAnalysisSuccess={handleAnalysisSuccess}
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
            selectedModel={selectedModel}
            setSelectedModel={updateSelectedModel}
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
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open-layout' : 'sidebar-closed-layout'}`}>
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

      {/* Floating Toggle Menu Button - visible on all screens when sidebar is closed */}
      {!isSidebarOpen && (
        <button 
          className="sidebar-toggle-floating" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open navigation menu"
          title="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Backdrop overlay for mobile/tablet sidebar */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalAnalyzed={userScanCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="main-content" style={{ zIndex: 1 }}>
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
