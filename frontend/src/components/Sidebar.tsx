import React from 'react';
import { LayoutDashboard, FileCheck, Briefcase, Settings as SettingsIcon, Sparkles, User, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDemoMode: boolean;
  totalAnalyzed: number; // For user, this represents their personal analyses count
  currentUser: { username: string; isAdmin: boolean } | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDemoMode,
  totalAnalyzed,
  currentUser,
  onLogout
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'screener', label: 'Resume Screener', icon: FileCheck },
    { id: 'matcher', label: 'Job Target Matcher', icon: Briefcase },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="glass-panel" style={{
      width: '280px',
      borderRadius: '0 1rem 1rem 0',
      borderLeft: 'none',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: '2rem 1.5rem',
      backgroundColor: '#0c0916'
    }}>
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '3rem',
        padding: '0 0.5rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '0.75rem',
          background: 'var(--grad-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px var(--primary-glow)'
        }}>
          <Sparkles size={20} color="white" />
        </div>
        <div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ffffff, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            margin: 0
          }}>ResumeCraft AI</h2>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>Screener & Matcher</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid transparent',
                backgroundColor: isActive ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                borderColor: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.95rem',
                fontWeight: 600,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: 'var(--font-primary)'
              }}
              className="sidebar-btn"
            >
              <IconComponent 
                size={20} 
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'color 0.2s ease'
                }} 
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer Info / User details */}
      <div style={{
        marginTop: 'auto',
        padding: '1.25rem',
        borderRadius: '0.75rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
            {currentUser ? currentUser.username.toUpperCase() : 'USER'}
          </span>
          {isDemoMode ? (
            <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>DEMO</span>
          ) : (
            <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>LIVE</span>
          )}
        </div>
        
        <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>My Scans:</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{totalAnalyzed}</span>
        </div>

        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            backgroundColor: 'rgba(239, 68, 68, 0.03)',
            color: '#fda4af',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>
    </aside>
  );
};
