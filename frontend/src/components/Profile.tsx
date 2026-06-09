import React, { useState, useEffect } from 'react';
import { User, Calendar, FileText, ChevronDown, CheckCircle2, AlertCircle, BookOpen, AlertTriangle, ArrowLeft, Briefcase, Sparkles, HelpCircle } from 'lucide-react';
import type { ScreeningResult, MatchResult } from '../utils/geminiApi';

export interface ScanRecord {
  id: string;
  filename: string;
  date: string;
  score: number;
  type: 'screen' | 'match';
  result: ScreeningResult | MatchResult;
}

interface ProfileProps {
  username: string;
  isAdmin: boolean;
  onClearHistory?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ username, isAdmin }) => {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    strengths: true,
    weaknesses: true,
    skills: true,
    suggestions: true,
    gaps: true,
    formatting: false,
    missing: true,
    tailor: true
  });

  useEffect(() => {
    // Load historical records for this specific logged-in user
    const historyKey = `user_history_${username.toLowerCase()}`;
    const savedHistoryStr = localStorage.getItem(historyKey) || '[]';
    try {
      const parsed = JSON.parse(savedHistoryStr) as ScanRecord[];
      // Sort: newest first
      parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(parsed);
    } catch (err) {
      console.error('Failed to parse user history', err);
    }
  }, [username]);

  const toggleAccordion = (section: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your entire scan history? This action is irreversible.')) {
      const historyKey = `user_history_${username.toLowerCase()}`;
      localStorage.setItem(historyKey, '[]');
      setHistory([]);
      setSelectedScan(null);
    }
  };

  // Compute stats
  const totalScans = history.length;
  const avgScore = totalScans > 0 
    ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / totalScans)
    : 0;

  // Render detail view of a single historical scan
  if (selectedScan) {
    const isScreen = selectedScan.type === 'screen';
    const screenRes = selectedScan.result as ScreeningResult;
    const matchRes = selectedScan.result as MatchResult;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
        {/* Back navigation header */}
        <div>
          <button 
            className="btn btn-secondary" 
            onClick={() => setSelectedScan(null)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' }}
          >
            <ArrowLeft size={16} /> Back to Profile History
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isScreen ? <FileText size={22} style={{ color: 'var(--primary)' }} /> : <Briefcase size={22} style={{ color: 'var(--secondary)' }} />}
                {isScreen ? 'Resume Screening Report' : 'Job Match Report'}
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                File: <strong>{selectedScan.filename}</strong> • Analyzed on {new Date(selectedScan.date).toLocaleString()}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCORE</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: getScoreColor(selectedScan.score), lineHeight: 1 }}>
                  {selectedScan.score}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

        {/* Dynamic content rendering based on report type */}
        {isScreen ? (
          /* Resume Screener Detail Layout */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
          }} className="screener-results">
            
            {/* Left side summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Profile Summary</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {screenRes.summary}
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <HelpCircle size={16} style={{ color: 'var(--secondary)' }} /> Layout Feedback
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {screenRes.formatting_feedback}
                </p>
              </div>
            </div>

            {/* Right side detailed accordion list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Strengths */}
              <div className={`accordion-item ${openAccordions.strengths ? 'accordion-open' : ''}`}>
                <div className="accordion-header" onClick={() => toggleAccordion('strengths')}>
                  <div className="accordion-header-left">
                    <span className="accordion-header-icon" style={{ color: 'var(--success)' }}>
                      <CheckCircle2 size={18} />
                    </span>
                    <span>Strengths</span>
                  </div>
                  <ChevronDown size={18} className="accordion-header-arrow" />
                </div>
                {openAccordions.strengths && (
                  <div className="accordion-content">
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
                      {screenRes.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Weaknesses */}
              <div className={`accordion-item ${openAccordions.weaknesses ? 'accordion-open' : ''}`}>
                <div className="accordion-header" onClick={() => toggleAccordion('weaknesses')}>
                  <div className="accordion-header-left">
                    <span className="accordion-header-icon" style={{ color: 'var(--danger)' }}>
                      <AlertCircle size={18} />
                    </span>
                    <span>Weaknesses</span>
                  </div>
                  <ChevronDown size={18} className="accordion-header-arrow" />
                </div>
                {openAccordions.weaknesses && (
                  <div className="accordion-content">
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0 }}>
                      {screenRes.weaknesses.map((wk, idx) => (
                        <li key={idx}>{wk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Career Gaps */}
              {screenRes.gaps && screenRes.gaps.length > 0 && (
                <div className={`accordion-item ${openAccordions.gaps ? 'accordion-open' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('gaps')}>
                    <div className="accordion-header-left">
                      <span className="accordion-header-icon" style={{ color: 'var(--warning)' }}>
                        <AlertTriangle size={18} />
                      </span>
                      <span>Career Gaps</span>
                    </div>
                    <ChevronDown size={18} className="accordion-header-arrow" />
                  </div>
                  {openAccordions.gaps && (
                    <div className="accordion-content">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {screenRes.gaps.map((gap, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            gap: '0.5rem',
                            background: 'rgba(245, 158, 11, 0.03)',
                            border: '1px solid rgba(245, 158, 11, 0.1)',
                            borderRadius: '0.4rem',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.85rem'
                          }}>
                            <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                            <span>{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Missing Skills */}
              <div className={`accordion-item ${openAccordions.skills ? 'accordion-open' : ''}`}>
                <div className="accordion-header" onClick={() => toggleAccordion('skills')}>
                  <div className="accordion-header-left">
                    <span className="accordion-header-icon">
                      <FileText size={18} />
                    </span>
                    <span>Missing Skills</span>
                  </div>
                  <ChevronDown size={18} className="accordion-header-arrow" />
                </div>
                {openAccordions.skills && (
                  <div className="accordion-content">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {screenRes.missing_skills.map((sk, idx) => {
                        const badgeClass = 
                          sk.importance === 'high' ? 'badge-danger' : 
                          sk.importance === 'medium' ? 'badge-warning' : 
                          'badge-success';
                        return (
                          <span key={idx} className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
                            {sk.skill} • {sk.importance}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Course suggestions */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpen size={18} style={{ color: 'var(--primary)' }} /> Suggested E-Learning Resources
                </h3>
                <div className="course-grid" style={{ margin: 0 }}>
                  {screenRes.courses.map((course, idx) => (
                    <div key={idx} className="course-card" style={{ padding: '0.75rem 1rem' }}>
                      <div className="course-info">
                        <h4 style={{ fontSize: '0.85rem' }}>{course.title}</h4>
                        <span className="course-platform" style={{ fontSize: '0.65rem' }}>{course.platform}</span>
                      </div>
                      <a href={course.link} target="_blank" rel="noopener noreferrer" className="course-link">
                        <BookOpen size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Job Matcher Detail Layout */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
          }} className="screener-results">
            
            {/* Left side details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)' }}>
                  <AlertTriangle size={18} /> Main Alignment Gaps
                </h3>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0, fontSize: '0.9rem' }}>
                  {matchRes.resume_gaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>

              <div className={`accordion-item ${openAccordions.missing ? 'accordion-open' : ''}`}>
                <div className="accordion-header" onClick={() => toggleAccordion('missing')}>
                  <div className="accordion-header-left">
                    <span className="accordion-header-icon" style={{ color: 'var(--danger)' }}>
                      <AlertCircle size={18} />
                    </span>
                    <span>Missing Prerequisites</span>
                  </div>
                  <ChevronDown size={18} className="accordion-header-arrow" />
                </div>
                {openAccordions.missing && (
                  <div className="accordion-content">
                    <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: 0, fontSize: '0.9rem' }}>
                      {matchRes.missing_requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right side tailoring cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={`accordion-item ${openAccordions.tailor ? 'accordion-open' : ''}`}>
                <div className="accordion-header" onClick={() => toggleAccordion('tailor')}>
                  <div className="accordion-header-left">
                    <span className="accordion-header-icon" style={{ color: 'var(--primary)' }}>
                      <Sparkles size={18} />
                    </span>
                    <span>Tailoring Recommendations</span>
                  </div>
                  <ChevronDown size={18} className="accordion-header-arrow" />
                </div>
                {openAccordions.tailor && (
                  <div className="accordion-content" style={{ paddingBottom: '0.25rem' }}>
                    {matchRes.tailoring_suggestions.map((sug, idx) => (
                      <div key={idx} className="tailor-suggestion-card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                        <div className="tailor-section-tag" style={{ fontSize: '0.7rem' }}>{sug.section}</div>
                        <div className="tailor-diff" style={{ margin: '0.5rem 0', gap: '0.5rem' }}>
                          <div className="diff-box diff-box-original" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }} data-type="Original">
                            {sug.original_text}
                          </div>
                          <div className="diff-box diff-box-suggested" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }} data-type="Suggested">
                            {sug.suggested_text}
                          </div>
                        </div>
                        <div className="tailor-reason" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          <strong>Strategy:</strong> {sug.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matching strengths */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={14} /> Matching Credentials
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {matchRes.strengths_matching.map((str, idx) => (
                    <span key={idx} className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                      {str}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    );
  }

  // Standard Profile dashboard & list history view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      {/* Header */}
      <div>
        <h1>User Profile</h1>
        <p className="subtitle">View your profile details, statistics, and past evaluation archives</p>
      </div>

      {/* Profile Card & Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
      }} className="screener-results">
        
        {/* User Card */}
        <div className="glass-panel" style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--grad-glow)',
            opacity: 0.4,
            zIndex: 0
          }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px var(--primary-glow)',
              color: 'white'
            }}>
              <User size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{username}</h3>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', marginTop: '0.25rem', display: 'inline-block' }}>
                {isAdmin ? 'Administrator / Owner' : 'Standard Member'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                <Calendar size={14} />
                <span>Active Session Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1 }}>{totalScans}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Resumes Screened</span>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', lineHeight: 1.1 }}>
              {avgScore > 0 ? `${avgScore}%` : 'N/A'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Scan Score</span>
          </div>
        </div>

      </div>

      {/* Scan History Archives log */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} /> Analysis History Log
          </h3>
          {history.length > 0 && (
            <button className="btn btn-secondary" onClick={handleClear} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--danger)' }}>
              Clear Archives
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '0.95rem' }}>No resumes screened yet under this account.</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>Go upload a resume to start building your profile records!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((record) => (
              <div 
                key={record.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.75rem',
                  padding: '1rem 1.25rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '0.5rem',
                    background: record.type === 'screen' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: record.type === 'screen' ? 'var(--primary)' : 'var(--secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {record.type === 'screen' ? <FileText size={20} /> : <Briefcase size={20} />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>{record.filename}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {record.type === 'screen' ? 'Screener' : 'Job Match'} • {new Date(record.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCORE</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: getScoreColor(record.score) }}>
                      {record.score}%
                    </span>
                  </div>
                  
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setSelectedScan(record)}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
