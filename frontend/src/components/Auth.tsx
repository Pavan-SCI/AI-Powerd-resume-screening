import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, User, Lock, UserPlus, LogIn } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (username: string, isAdmin: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (isLogin) {
      // Hardcoded Admin Check
      if (username.toLowerCase() === 'admin' && password === 'admin') {
        onLoginSuccess('Admin', true);
        return;
      }

      // Standard User Login Check
      const usersListStr = localStorage.getItem('registered_users') || '[]';
      const usersList = JSON.parse(usersListStr);
      const user = usersList.find(
        (u: any) => u.username.toLowerCase() === username.toLowerCase().trim()
      );

      if (user && user.password === password) {
        onLoginSuccess(user.username, false);
      } else {
        setError('Invalid username or password.');
      }
    } else {
      // Signup logic
      if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (username.toLowerCase().trim() === 'admin') {
        setError('The username "admin" is reserved.');
        return;
      }

      const usersListStr = localStorage.getItem('registered_users') || '[]';
      const usersList = JSON.parse(usersListStr);
      const userExists = usersList.some(
        (u: any) => u.username.toLowerCase() === username.toLowerCase().trim()
      );

      if (userExists) {
        setError('Username is already taken.');
        return;
      }

      // Add user to database
      const newUser = {
        username: username.trim(),
        password: password,
        registeredAt: new Date().toISOString()
      };
      usersList.push(newUser);
      localStorage.setItem('registered_users', JSON.stringify(usersList));

      setSuccessMessage('Registration successful! Please login.');
      setIsLogin(true);
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleToggleForm = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMessage(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-darker)',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 60%)',
      padding: '1.5rem',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000,
      boxSizing: 'border-box'
    }}>
      {/* Dynamic glow nodes in background */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
        top: '10%',
        left: '20%',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        bottom: '15%',
        right: '15%',
        pointerEvents: 'none'
      }}></div>

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand logo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '1rem',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px var(--primary-glow)'
          }}>
            <Sparkles size={24} color="white" />
          </div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ffffff, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            margin: 0
          }}>ResumeCraft AI</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
            {isLogin ? 'Log in to screen resumes & tailor layouts' : 'Create an account to track your resumes'}
          </p>
        </div>

        {/* Message banners */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '0.5rem',
            color: '#fda4af',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Lock size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '0.5rem',
            color: '#a7f3d0',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="authUsername">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                id="authUsername"
                type="text"
                className="form-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="authPassword">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                id="authPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="authConfirmPassword">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  id="authConfirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isLogin ? (
              <>
                <LogIn size={18} /> Log In
              </>
            ) : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button
                onClick={handleToggleForm}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 'inherit',
                  textDecoration: 'underline'
                }}
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                onClick={handleToggleForm}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 'inherit',
                  textDecoration: 'underline'
                }}
              >
                Log In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
