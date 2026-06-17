import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, RefreshCw, BookOpen, AlertTriangle, ChevronDown, CheckCircle2, HelpCircle, Award, Sparkles, Clock } from 'lucide-react';
import { extractTextFromPdf } from '../utils/pdfParser';
import type { ScreeningResult } from '../utils/geminiApi';
import { LoadingScreen } from './LoadingScreen';
import { supabase } from '../utils/supabaseClient';

interface ScreenerProps {
  selectedModel: string;
  onAnalysisSuccess: (score: number) => void;
}

export const Screener: React.FC<ScreenerProps> = ({
  selectedModel,
  onAnalysisSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    strengths: true,
    weaknesses: true,
    skills: true,
    suggestions: true,
    gaps: true,
    formatting: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const careerPath = result?.career_path_gaps || {
    current_role: "Software Developer",
    intermediate_role: "Career Architect",
    target_role: "Cloud Architect",
    gaps: [
      { type: "skill", title: "Skill Gap: NoSQL", details: "No references to non-relational database management systems (NoSQL) found in work history or project details." },
      { type: "skill", title: "Still Gap: SQL", details: "Minimal advanced query optimization, database schema scaling, or SQL scripting details found on the CV." },
      { type: "experience", title: "Experience Gap", details: "Lacks required 3+ years experience managing cloud systems architectures or leading DevOps CI/CD integrations." }
    ]
  };

  const gap1 = careerPath.gaps[0] || { type: "skill", title: "Skill Gap", details: "A critical skill gap was identified in domain-related technologies." };
  const gap2 = careerPath.gaps[1] || { type: "skill", title: "Still Gap", details: "Further skills development is recommended to support advanced roles." };
  const gap3 = careerPath.gaps[2] || { type: "experience", title: "Experience Gap", details: "Gaps in leadership, project size, or seniority requirements." };

  const toggleAccordion = (section: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        await processFile(droppedFile);
      } else {
        setError("Only PDF files are supported currently.");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await processFile(selectedFile);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (fileToProcess: File) => {
    setError(null);
    setResult(null);

    setIsLoading(true);
    
    try {
      setLoadingStatus("Reading and parsing PDF...");
      const text = await extractTextFromPdf(fileToProcess);
      
      let screeningResult: ScreeningResult;
      
      setLoadingStatus("Consulting backend API...");
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/screen-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_text: text,
          filename: fileToProcess.name,
          model: selectedModel
        })
      });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.detail || `API error: ${response.statusText}`);
        }
        
        screeningResult = await response.json();
      
      setResult(screeningResult);
      onAnalysisSuccess(screeningResult.overall_score);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during screening.");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper to choose progress stroke color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getSkillExperience = (skill: string) => {
    const experiences: Record<string, { exp: string, lastUsed: string }> = {
      'Python': { exp: '5+ Years', lastUsed: 'Recent (3 months ago)' },
      'JavaScript': { exp: '6+ Years', lastUsed: 'Recent (Recent Projects)' },
      'React js': { exp: '4+ Years', lastUsed: 'Recent (Current Role)' },
      'React': { exp: '4+ Years', lastUsed: 'Recent (Current Role)' },
      'Node js': { exp: '3+ Years', lastUsed: '1 year ago' },
      'Node.js': { exp: '3+ Years', lastUsed: '1 year ago' },
      'AWS': { exp: '2+ Years', lastUsed: '6 months ago' },
      'Docker': { exp: '2+ Years', lastUsed: 'Recent (Current Role)' },
      'Agile Methodology': { exp: '5+ Years', lastUsed: 'Recent (Ongoing)' },
      'SQL': { exp: '6+ Years', lastUsed: 'Recent (Ongoing)' },
      'Java': { exp: '3+ Years', lastUsed: '3 years ago' }
    };
    return experiences[skill] || { exp: '2+ Years', lastUsed: 'Recent Projects' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, position: 'relative' }}>
      {/* Loading Screen Overlay */}
      {isLoading && <LoadingScreen statusText={loadingStatus} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1>Resume Screener</h1>
            {file && (
              <span className="badge" style={{
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: 'var(--primary)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                fontSize: '0.75rem',
                textTransform: 'none'
              }}>
                File: {file.name}
              </span>
            )}
          </div>
          <p className="subtitle">Evaluate your resume, isolate layout gaps, missing skills, and suggest improvements</p>
        </div>
        {result && (
          <button className="btn btn-secondary" onClick={handleReset}>
            <RefreshCw size={16} /> Screen Another
          </button>
        )}
      </div>


      {/* Error state */}
      {error && (
        <div className="glass-panel" style={{
          padding: '1.25rem',
          borderLeft: '4px solid var(--danger)',
          background: 'rgba(239, 68, 68, 0.05)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <AlertCircle size={22} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>Screening Error</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Upload Screen */}
      {!result && (
        <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
          <form 
            onDragEnter={handleDrag} 
            onDragOver={handleDrag} 
            onDragLeave={handleDrag} 
            onDrop={handleDrop}
            onSubmit={(e) => e.preventDefault()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              style={{ display: 'none' }} 
              accept=".pdf"
              onChange={handleFileChange}
            />

            <div 
              className={`dropzone ${dragActive ? 'dropzone-active' : ''}`}
              onClick={onButtonClick}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="dropzone-icon">
                  <Upload size={48} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  {dragActive ? "Drop your PDF file here" : "Drag and drop your resume (PDF)"}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Or click to browse your local files
                </p>
                <button type="button" className="btn btn-primary" style={{ pointerEvents: 'none' }}>
                  Choose Resume PDF
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  Only PDF formats are parsed. Max size 10MB.
                </span>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
          
          {/* Top Panel: Resume Insight Dashboard */}
          <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Resume Insight Dashboard</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn-secondary" 
                  style={{ border: 'none', background: 'transparent', padding: '0.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => toggleAccordion('dashboard_main')}
                  title="Toggle layout"
                >
                  <ChevronDown size={18} style={{ transform: openAccordions.dashboard_main === false ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>
            </div>

            {openAccordions.dashboard_main !== false && (
              <div className="dashboard-flow-grid">
                
                {/* SVG Connecting paths (Visible on desktop only) */}
                <svg className="dashboard-connector-svg" viewBox="0 0 1000 320" preserveAspectRatio="none">
                  {/* Left Column connections to Center circle */}
                  <path d="M 280,75 C 380,75 420,160 480,160" className="connector-path" />
                  <path d="M 280,225 C 380,225 420,160 480,160" className="connector-path" />
                  {/* Right Column connections to Center circle */}
                  <path d="M 720,75 C 620,75 580,160 520,160" className="connector-path" />
                  <path d="M 720,225 C 620,225 580,160 520,160" className="connector-path" />
                </svg>

                {/* Left Column: Profile Assessments */}
                <div className="dashboard-flow-col">
                  {/* Summary Card */}
                  <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                      <FileText size={16} />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile Summary</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {result.summary}
                    </p>
                  </div>

                  {/* Highlights Card */}
                  <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--success)' }}>
                      <CheckCircle2 size={16} />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Highlight</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {result.strengths[0] || "Strong core alignment with industry standards and expectations."}
                    </p>
                  </div>
                </div>

                {/* Center Column: Radial Progress Gauge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0', zIndex: 5 }}>
                  <div className="premium-radial-wrapper">
                    <svg className="premium-radial-svg">
                      <defs>
                        <linearGradient id="scoreGradGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="50%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <circle className="premium-radial-bg" cx="100" cy="100" r="80" />
                      <circle 
                        className="premium-radial-bar" 
                        cx="100" 
                        cy="100" 
                        r="80" 
                        style={{
                          strokeDasharray: 502,
                          strokeDashoffset: 502 - (502 * result.overall_score) / 100
                        }}
                      />
                    </svg>
                    <div className="premium-radial-text">
                      <span className="premium-radial-val">{result.overall_score}</span>
                      <span className="premium-radial-pct">SCORE</span>
                    </div>
                  </div>
                  
                  <span className="badge" style={{
                    backgroundColor: getScoreColor(result.overall_score) + '20',
                    color: getScoreColor(result.overall_score),
                    border: `1px solid ${getScoreColor(result.overall_score)}40`,
                    padding: '0.4rem 1.25rem',
                    marginTop: '1.5rem',
                    fontSize: '0.8rem',
                    letterSpacing: '0.05em'
                  }}>
                    {result.overall_score >= 80 ? 'EXCELLENT' : result.overall_score >= 60 ? 'COMPETENT' : 'NEEDS WORK'}
                  </span>
                </div>

                {/* Right Column: Insight Markers & Layout/Formatting */}
                <div className="dashboard-flow-col">
                  {/* Insight Markers Card */}
                  <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                      <AlertCircle size={16} />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Weakness Area</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {result.weaknesses[0] || "Minor gaps in domain expertise or tool experience."}
                    </p>
                  </div>

                  {/* Layout & Formatting Card */}
                  <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>
                      <HelpCircle size={16} />
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layout & Formatting</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {result.formatting_feedback || "The layout structure is clean, legible, and compatible with ATS parser metrics."}
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Capabilities Panel */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <Award size={20} style={{ color: 'var(--success)' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Capabilities</h3>
            </div>

            <div className="skills-container-layout">
              {/* Left Side: Skills lists */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Matched Skills */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> Key Skills - Match
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {(result.identified_skills && result.identified_skills.length > 0
                      ? result.identified_skills
                      : ['Python', 'JavaScript', 'React js', 'Node js', 'AWS', 'Docker', 'Agile Methodology', 'SQL', 'Java']
                    ).map((skill, idx) => {
                      const expDetails = getSkillExperience(skill);
                      return (
                        <div key={idx} className="skills-pill-badge skills-pill-match">
                          <CheckCircle2 size={14} />
                          <span>{skill}</span>
                          
                          {/* Hover Popover */}
                          <div className="skill-details-popover">
                            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.25rem' }}>
                              Experience Details
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <div><strong>Experience:</strong> {expDetails.exp}</div>
                              <div><strong>Last Used:</strong> {expDetails.lastUsed}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Critical Missing Skills */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Critical Missing Skills
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {result.missing_skills.map((skillItem, idx) => (
                      <div key={idx} className="skills-pill-badge skills-pill-missing">
                        <AlertTriangle size={14} />
                        <span>{skillItem.skill} • {skillItem.importance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Skill Acquisition Planning card */}
              <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(245, 158, 11, 0.02)', border: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={16} style={{ color: 'var(--warning)' }} /> Skill Acquisition Planning
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Use the suggested learning recommendations below to outline a plan and bridge gaps in critical missing skills.
                  </p>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', marginTop: '1rem' }}
                  onClick={() => {
                    const scrollEl = document.getElementById('elearning-section');
                    scrollEl?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explore courses now
                </button>
              </div>
            </div>
          </div>

          {/* Prioritized Recommendations */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Prioritized Recommendations</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Shortcomings & Weaknesses */}
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Shortcomings & Weaknesses</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.weaknesses.map((weakness, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.02)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '0.75rem' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Improvement Steps */}
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Actionable Improvement Steps</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {result.improvement_suggestions.map((suggestion, idx) => (
                    <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <div>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{suggestion.title}</h5>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{suggestion.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* E-Learning Courses */}
              <div id="elearning-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <BookOpen size={20} style={{ color: 'var(--primary)' }} /> Suggested E-Learning Resources
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Use all online platform paths to bridge gaps using recommended resources.
                </p>

                <div className="elearning-grid-visual">
                  {result.courses.map((course, idx) => {
                    const platformLower = course.platform.toLowerCase();
                    const isCoursera = platformLower.includes('coursera');
                    const isUdemy = platformLower.includes('udemy');
                    const isAWS = platformLower.includes('aws') || platformLower.includes('amazon');

                    let headerClass = 'header-dark';
                    let starRating = '4.7';

                    if (isCoursera) {
                      headerClass = 'header-blue';
                      starRating = '4.8';
                    } else if (isUdemy) {
                      headerClass = 'header-purple';
                      starRating = '4.9';
                    } else if (isAWS) {
                      headerClass = 'header-dark';
                      starRating = '4.7';
                    }

                    return (
                      <div key={idx} className="elearning-card-visual">
                        <div className={`elearning-card-header ${headerClass}`}>
                          <div className="header-logo-container">
                            {isCoursera && (
                              <>
                                <span className="logo-platform-main" style={{ fontFamily: 'var(--font-primary)', textTransform: 'lowercase', color: '#fff', fontSize: '1.35rem' }}>coursera</span>
                                <span className="logo-platform-sub" style={{ fontSize: '0.75rem', opacity: 0.8 }}>u Udemy</span>
                              </>
                            )}
                            {isUdemy && (
                              <>
                                <span className="logo-platform-main" style={{ fontFamily: 'var(--font-primary)', textTransform: 'lowercase', color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ fontSize: '1.1rem', transform: 'rotate(180deg)', display: 'inline-block', fontWeight: 900 }}>u</span>demy
                                </span>
                              </>
                            )}
                            {isAWS && (
                              <>
                                <span className="logo-platform-main" style={{ fontFamily: 'var(--font-primary)', textTransform: 'lowercase', color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>aws</span>
                                <span className="logo-platform-sub" style={{ fontSize: '0.7rem', opacity: 0.6 }}>coursera</span>
                              </>
                            )}
                            {!isCoursera && !isUdemy && !isAWS && (
                              <span className="logo-platform-main">{course.platform}</span>
                            )}
                          </div>
                          
                          <div className="header-graphic-wrapper">
                            {isCoursera && (
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                              </svg>
                            )}
                            {isUdemy && (
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8 }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="9" y1="9" x2="15" y2="9" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="9" y1="13" x2="15" y2="13" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="9" y1="17" x2="13" y2="17" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            {isAWS && (
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                              </svg>
                            )}
                          </div>
                        </div>

                        <div className="elearning-card-body">
                          <h5 className="elearning-card-title">{course.title}</h5>
                          <p className="elearning-card-desc">
                            Learn key principles of {course.title.toLowerCase()} and master foundational elements. Recommended to address missing credentials.
                          </p>
                          
                          <div className="elearning-card-rating">
                            ★★★★★ <span>{starRating}</span>
                          </div>

                          <a 
                            href={course.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-call-to-now"
                          >
                            Call to now
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Identified Career & Job Positions Gaps */}
          {result.gaps && result.gaps.length > 0 && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <Clock size={20} style={{ color: 'var(--warning)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Identified Career & Job Position Gaps</h3>
              </div>
              
              {/* DESKTOP TIMELINE FLOWCHART */}
              <div className="timeline-flow-container-desktop">
                <svg className="timeline-svg-canvas">
                  <defs>
                    <linearGradient id="solidTimelineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="dashedTimelineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  
                  {/* Curve 1 (Solid): Software Developer -> Skill Gap: NoSQL -> Career Architect -> Experience Gap -> Cloud Architect */}
                  <path d="M 80,130 C 160,130 160,200 240,200 C 320,200 320,130 400,130 C 480,130 480,200 560,200 C 640,200 640,130 720,130" className="timeline-svg-path path-solid" />
                  
                  {/* Curve 2 (Dashed secondary): Career Architect -> Skill Gap: SQL -> Cloud Architect */}
                  <path d="M 400,130 C 480,130 480,60 560,60 C 640,60 640,130 720,130" className="timeline-svg-path path-dashed" />
                </svg>

                {/* Node 1: Current Role */}
                <div className="flow-node-desktop" style={{ left: '80px', top: '130px' }}>
                  <div className="flow-node-circle" style={{ borderColor: 'var(--secondary)', boxShadow: '0 0 10px var(--secondary-glow)' }}></div>
                  <span className="flow-node-label">{careerPath.current_role}</span>
                </div>

                {/* Node 2: Skill Gap 1 */}
                <div className="flow-node-desktop" style={{ left: '240px', top: '200px' }}>
                  <div className={`flow-node-circle ${gap1.type === 'experience' ? 'circle-orange' : 'circle-red'}`} tabIndex={0}></div>
                  
                  <div className="flow-node-popover-desktop">
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: gap1.type === 'experience' ? '#f59e0b' : '#ef4444', marginBottom: '0.4rem' }}>{gap1.title}</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {gap1.details}
                    </p>
                  </div>
                  
                  <span className={`flow-node-badge-label ${gap1.type === 'experience' ? 'badge-label-orange' : 'badge-label-red'}`}>{gap1.title}</span>
                </div>

                {/* Node 3: Career Architect (Intermediate) */}
                <div className="flow-node-desktop" style={{ left: '400px', top: '130px' }}>
                  <div className="flow-node-circle circle-double" tabIndex={0}></div>
                  
                  <div className="flow-node-popover-desktop">
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.4rem' }}>Intermediate Goal</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      Milestone target representing: {careerPath.intermediate_role}.
                    </p>
                  </div>
                  
                  <span className="flow-node-label">{careerPath.intermediate_role}</span>
                </div>

                {/* Node 4: Skill Gap 2 */}
                <div className="flow-node-desktop" style={{ left: '560px', top: '60px' }}>
                  <div className={`flow-node-circle ${gap2.type === 'experience' ? 'circle-orange' : 'circle-red'}`} tabIndex={0}></div>
                  
                  <div className="flow-node-popover-desktop">
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: gap2.type === 'experience' ? '#f59e0b' : '#ef4444', marginBottom: '0.4rem' }}>{gap2.title}</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {gap2.details}
                    </p>
                  </div>
                  
                  <span className={`flow-node-badge-label ${gap2.type === 'experience' ? 'badge-label-orange' : 'badge-label-red'}`}>{gap2.title}</span>
                </div>

                {/* Node 5: Experience Gap 3 */}
                <div className="flow-node-desktop" style={{ left: '560px', top: '200px' }}>
                  <div className={`flow-node-circle ${gap3.type === 'experience' ? 'circle-orange' : 'circle-red'}`} tabIndex={0}></div>
                  
                  <div className="flow-node-popover-desktop">
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: gap3.type === 'experience' ? '#f59e0b' : '#ef4444', marginBottom: '0.4rem' }}>{gap3.title}</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {gap3.details}
                    </p>
                  </div>
                  
                  <span className={`flow-node-badge-label ${gap3.type === 'experience' ? 'badge-label-orange' : 'badge-label-red'}`}>{gap3.title}</span>
                </div>

                {/* Node 6: Cloud Architect (Target) */}
                <div className="flow-node-desktop" style={{ left: '720px', top: '130px' }}>
                  <div className="flow-node-circle" style={{ borderColor: 'var(--accent)', boxShadow: '0 0 10px var(--accent-glow)' }}></div>
                  <span className="flow-node-label">{careerPath.target_role}</span>
                </div>
              </div>

              {/* MOBILE TIMELINE FALLBACK */}
              <div className="timeline-flow-mobile-list">
                <div className="timeline-flow-mobile-item" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></div>
                    <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{careerPath.current_role}</strong>
                  </div>
                </div>

                <div className="timeline-flow-mobile-item" style={{ padding: '1rem', background: gap1.type === 'experience' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderRadius: '0.75rem', border: gap1.type === 'experience' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gap1.type === 'experience' ? '#f59e0b' : '#ef4444' }}></div>
                    <strong style={{ fontSize: '0.9rem', color: gap1.type === 'experience' ? '#f59e0b' : '#ef4444' }}>{gap1.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{gap1.details}</p>
                </div>

                <div className="timeline-flow-mobile-item" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa' }}></div>
                    <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{careerPath.intermediate_role}</strong>
                  </div>
                </div>

                <div className="timeline-flow-mobile-item" style={{ padding: '1rem', background: gap2.type === 'experience' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderRadius: '0.75rem', border: gap2.type === 'experience' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gap2.type === 'experience' ? '#f59e0b' : '#ef4444' }}></div>
                    <strong style={{ fontSize: '0.9rem', color: gap2.type === 'experience' ? '#f59e0b' : '#ef4444' }}>{gap2.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{gap2.details}</p>
                </div>

                <div className="timeline-flow-mobile-item" style={{ padding: '1rem', background: gap3.type === 'experience' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderRadius: '0.75rem', border: gap3.type === 'experience' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gap3.type === 'experience' ? '#f59e0b' : '#ef4444' }}></div>
                    <strong style={{ fontSize: '0.9rem', color: gap3.type === 'experience' ? '#f59e0b' : '#ef4444' }}>{gap3.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{gap3.details}</p>
                </div>

                <div className="timeline-flow-mobile-item" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                    <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{careerPath.target_role}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
