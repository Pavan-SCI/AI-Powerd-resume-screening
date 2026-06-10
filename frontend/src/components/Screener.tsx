import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, RefreshCw, BookOpen, AlertTriangle, ChevronDown, CheckCircle2, HelpCircle } from 'lucide-react';
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
        }} className="screener-results">
          
          {/* Left Column: Summary & Score Dashboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Score Card */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--grad-glow)',
                opacity: 0.5,
                zIndex: 0
              }}></div>
              
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>Resume Quality Score</h3>
                
                {/* SVG Radial Progress Circle */}
                <div className="radial-progress-wrapper" style={{ marginBottom: '1rem' }}>
                  <svg className="radial-progress-svg">
                    <defs>
                      <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="100%" stopColor="var(--secondary)" />
                      </linearGradient>
                    </defs>
                    <circle className="radial-progress-bg" cx="80" cy="80" r="70" />
                    <circle 
                      className="radial-progress-bar" 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      style={{
                        strokeDasharray: 440,
                        strokeDashoffset: 440 - (440 * result.overall_score) / 100
                      }}
                    />
                  </svg>
                  <div className="radial-progress-text">
                    <span className="radial-progress-val">{result.overall_score}</span>
                    <span className="radial-progress-pct">%</span>
                  </div>
                </div>

                <span className="badge" style={{
                  backgroundColor: getScoreColor(result.overall_score) + '20',
                  color: getScoreColor(result.overall_score),
                  border: `1px solid ${getScoreColor(result.overall_score)}40`,
                  padding: '0.35rem 1rem'
                }}>
                  {result.overall_score >= 80 ? 'Excellent' : result.overall_score >= 60 ? 'Competent' : 'Needs Work'}
                </span>
              </div>
            </div>

            {/* Resume Summary Card */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Profile Assessment</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {result.summary}
              </p>
            </div>
            
            {/* Formatting Feedback Card */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={18} style={{ color: 'var(--secondary)' }} /> Layout & Formatting
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {result.formatting_feedback}
              </p>
            </div>
          </div>

          {/* Right Column: Strengths, Weaknesses, Gaps, Suggestions, and Courses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Strengths Accordion */}
            <div className={`accordion-item ${openAccordions.strengths ? 'accordion-open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion('strengths')}>
                <div className="accordion-header-left">
                  <span className="accordion-header-icon" style={{ color: 'var(--success)' }}>
                    <CheckCircle2 size={18} />
                  </span>
                  <span>Key Strengths & Highlights</span>
                </div>
                <ChevronDown size={18} className="accordion-header-arrow" />
              </div>
              {openAccordions.strengths && (
                <div className="accordion-content">
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.strengths.map((strength, idx) => (
                      <li key={idx} style={{ color: 'var(--text-secondary)' }}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Shortcomings / Weaknesses Accordion */}
            <div className={`accordion-item ${openAccordions.weaknesses ? 'accordion-open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion('weaknesses')}>
                <div className="accordion-header-left">
                  <span className="accordion-header-icon" style={{ color: 'var(--danger)' }}>
                    <AlertCircle size={18} />
                  </span>
                  <span>Shortcomings & Weaknesses</span>
                </div>
                <ChevronDown size={18} className="accordion-header-arrow" />
              </div>
              {openAccordions.weaknesses && (
                <div className="accordion-content">
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.weaknesses.map((weakness, idx) => (
                      <li key={idx} style={{ color: 'var(--text-secondary)' }}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Work & Career Gaps Accordion */}
            {result.gaps && result.gaps.length > 0 && (
              <div className={`accordion-item ${openAccordions.gaps ? 'accordion-open' : ''}`}>
                <div className="accordion-header" onClick={() => toggleAccordion('gaps')}>
                  <div className="accordion-header-left">
                    <span className="accordion-header-icon" style={{ color: 'var(--warning)' }}>
                      <AlertTriangle size={18} />
                    </span>
                    <span>Identified Career & Qualifications Gaps</span>
                  </div>
                  <ChevronDown size={18} className="accordion-header-arrow" />
                </div>
                {openAccordions.gaps && (
                  <div className="accordion-content">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {result.gaps.map((gap, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          gap: '0.5rem',
                          background: 'rgba(245, 158, 11, 0.03)',
                          border: '1px solid rgba(245, 158, 11, 0.1)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem'
                        }}>
                          <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Missing Skills Accordion */}
            <div className={`accordion-item ${openAccordions.skills ? 'accordion-open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion('skills')}>
                <div className="accordion-header-left">
                  <span className="accordion-header-icon">
                    <FileText size={18} />
                  </span>
                  <span>Missing Skills Analysis</span>
                </div>
                <ChevronDown size={18} className="accordion-header-arrow" />
              </div>
              {openAccordions.skills && (
                <div className="accordion-content">
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    These essential skill keywords were not detected in your resume text. Grouped by priority:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {result.missing_skills.map((skillItem, idx) => {
                      const badgeClass = 
                        skillItem.importance === 'high' ? 'badge-danger' : 
                        skillItem.importance === 'medium' ? 'badge-warning' : 
                        'badge-success';
                      return (
                        <span key={idx} className={`badge ${badgeClass}`} style={{ fontSize: '0.75rem' }}>
                          {skillItem.skill} • {skillItem.importance}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Improvement Suggestions Accordion */}
            <div className={`accordion-item ${openAccordions.suggestions ? 'accordion-open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion('suggestions')}>
                <div className="accordion-header-left">
                  <span className="accordion-header-icon">
                    <RefreshCw size={18} />
                  </span>
                  <span>Actionable Improvement Steps</span>
                </div>
                <ChevronDown size={18} className="accordion-header-arrow" />
              </div>
              {openAccordions.suggestions && (
                <div className="accordion-content">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {result.improvement_suggestions.map((suggestion, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        padding: '1rem'
                      }}>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {idx + 1}. {suggestion.title}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          {suggestion.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommended Learning Courses Accordion */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <BookOpen size={20} style={{ color: 'var(--primary)' }} /> Suggested E-Learning Resources
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Upskill yourself to match missing credentials using these curated recommendations:
              </p>
              
              <div className="course-grid">
                {result.courses.map((course, idx) => (
                  <div key={idx} className="course-card">
                    <div className="course-info">
                      <h4>{course.title}</h4>
                      <span className="course-platform">{course.platform}</span>
                    </div>
                    <a 
                      href={course.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="course-link"
                      title="Explore course"
                      style={{ padding: '0.25rem' }}
                    >
                      <BookOpen size={18} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
