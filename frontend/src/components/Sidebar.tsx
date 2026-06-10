import React from 'react';
import { 
  LayoutDashboard, 
  FileCheck, 
  Briefcase, 
  Settings as SettingsIcon, 
  Sparkles, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalAnalyzed: number;
  currentUser: { username: string; isAdmin: boolean } | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  totalAnalyzed,
  currentUser,
  onLogout,
  isOpen,
  onClose,
  onToggle
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'screener', label: 'Resume Screener', icon: FileCheck },
    { id: 'matcher', label: 'Job Matcher', icon: Briefcase },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    // On mobile, auto close sidebar on selection
    if (window.innerWidth <= 1024) {
      onClose();
    }
  };

  const userInitials = currentUser?.username
    ? currentUser.username.substring(0, 2).toUpperCase()
    : 'UR';

  return (
    <aside className={`glass-panel app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* ── Brand Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isOpen ? 'space-between' : 'center',
        marginBottom: isOpen ? '2.5rem' : '1.5rem',
        flexDirection: isOpen ? 'row' : 'column',
        gap: isOpen ? '0' : '0.75rem',
        minHeight: isOpen ? 'auto' : '80px'
      }}>
        {/* Logo block */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            minWidth: '38px',
            borderRadius: '0.75rem',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)',
          }}>
            <Sparkles size={18} color="white" />
          </div>
          {isOpen && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <h2 style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ffffff, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.2
              }}>ResumeCraft AI</h2>
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>Screener & Matcher</span>
            </div>
          )}
        </div>

        {/* Toggle chevron */}
        <button
          onClick={onToggle}
          className="sidebar-close-btn"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            minWidth: '32px',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* ── Divider ── */}
      <div style={{
        height: '1px',
        background: 'var(--border-color)',
        marginBottom: '1rem',
        marginLeft: isOpen ? '0' : '-0.25rem',
        marginRight: isOpen ? '0' : '-0.25rem'
      }} />

      {/* ── Navigation Items ── */}
      <nav style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.35rem', 
        flexGrow: 1,
        alignItems: isOpen ? 'stretch' : 'center'
      }}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id)}
              className="sidebar-btn"
              data-tooltip={!isOpen ? item.label : undefined}
              title={!isOpen ? item.label : undefined}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isOpen ? 'flex-start' : 'center',
                gap: isOpen ? '0.85rem' : '0',
                width: isOpen ? '100%' : '44px',
                height: '44px',
                padding: isOpen ? '0 1.15rem' : '0',
                borderRadius: '0.75rem',
                border: '1px solid transparent',
                backgroundColor: isActive
                  ? 'rgba(139, 92, 246, 0.1)'
                  : 'transparent',
                borderColor: isActive
                  ? 'rgba(139, 92, 246, 0.2)'
                  : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: 'var(--font-primary)',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <IconComponent 
                size={20} 
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'color 0.2s ease',
                  flexShrink: 0
                }} 
              />
              {isOpen && (
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  opacity: 1,
                  transition: 'opacity 0.2s ease'
                }}>
                  {item.label}
                </span>
              )}
              {/* Active indicator dot for collapsed mode */}
              {!isOpen && isActive && (
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '20px',
                  borderRadius: '0 4px 4px 0',
                  background: 'var(--grad-primary)',
                  boxShadow: '0 0 8px var(--primary-glow)'
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Divider before footer ── */}
      <div style={{
        height: '1px',
        background: 'var(--border-color)',
        margin: '0.75rem 0',
        marginLeft: isOpen ? '0' : '-0.25rem',
        marginRight: isOpen ? '0' : '-0.25rem'
      }} />

      {/* ── Footer / User details ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        alignItems: isOpen ? 'stretch' : 'center'
      }}>
        {isOpen ? (
          <>
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '110px'
                }}>
                  {currentUser ? currentUser.username.toUpperCase() : 'USER'}
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>LIVE</span>
              </div>
              
              <div style={{ height: '1px', background: 'var(--border-color)' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>My Scans:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{totalAnalyzed}</span>
              </div>
            </div>

            <button
              onClick={() => { onLogout(); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.55rem',
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
          </>
        ) : (
          <>
            {/* Collapsed: user avatar circle */}
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--grad-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 8px var(--primary-glow)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onClick={() => handleTabSelect('profile')}
              title={`Profile: ${currentUser?.username}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = '0 4px 16px var(--primary-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px var(--primary-glow)';
              }}
            >
              {userInitials}
            </div>

            {/* Collapsed: logout icon */}
            <button
              onClick={() => { onLogout(); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '0.5rem',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                backgroundColor: 'rgba(239, 68, 68, 0.03)',
                color: '#fda4af',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
              }}
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

