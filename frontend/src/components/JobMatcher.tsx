import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, RefreshCw, FileText, ChevronDown, CheckCircle2, Award, Sparkles, BookOpen } from 'lucide-react';
import { extractTextFromPdf } from '../utils/pdfParser';
import type { MatchResult } from '../utils/geminiApi';
import { LoadingScreen } from './LoadingScreen';
import { supabase } from '../utils/supabaseClient';

interface JobMatcherProps {
  selectedModel: string;
  onAnalysisSuccess: (score: number) => void;
}

export const JobMatcher: React.FC<JobMatcherProps> = ({
  selectedModel,
  onAnalysisSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    strengths: true,
    missing: true,
    gaps: true,
    skills: true,
    suggestions: true
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setResumeFile(file);
      } else {
        setError("Only PDF files are supported currently.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setResumeFile(file);
      } else {
        setError("Only PDF files are supported currently.");
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleMatch = async () => {
    setError(null);
    setResult(null);

    if (!resumeFile) {
      setError("Please upload a resume first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please enter a job or internship description.");
      return;
    }

    setIsLoading(true);
    
    try {
      setLoadingStatus("Parsing resume PDF text...");
      const resumeText = await extractTextFromPdf(resumeFile);
      
      let matchResult: MatchResult;

      setLoadingStatus("Consulting backend API...");
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/match-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
          filename: resumeFile.name,
          model: selectedModel
        })
      });
        
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || `API error: ${response.statusText}`);
      }
        
      matchResult = await response.json();
      
      setResult(matchResult);
      onAnalysisSuccess(matchResult.match_percentage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during matching.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleMatch();
  };

  const handleReset = () => {
    setResumeFile(null);
    setJobDescription('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return 'var(--success)';
    if (pct >= 55) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, position: 'relative' }}>
      {/* Loading Overlay */}
      {isLoading && <LoadingScreen statusText={loadingStatus} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Job Target Matcher</h1>
          <p className="subtitle">Compare your resume to target job descriptions to identify keywords and tailor wording</p>
        </div>
        {result && (
          <button className="btn btn-secondary" onClick={handleReset}>
            <RefreshCw size={16} /> Compare Another
          </button>
        )}
      </div>

      {/* Error Banners */}
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
            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>Matching Error</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Input Form Screen */}
      {!result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '2rem'
            }} className="screener-results">
              
              {/* Left side: CV PDF drag zone */}
              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>1. Provide Resume PDF</h3>
                
                <input 
                  ref={fileInputRef}
                  type="file" 
                  style={{ display: 'none' }} 
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                
                <div 
                  className={`dropzone ${dragActive ? 'dropzone-active' : ''}`}
                  onDragEnter={handleDrag} 
                  onDragOver={handleDrag} 
                  onDragLeave={handleDrag} 
                  onDrop={handleDrop}
                  onClick={onButtonClick}
                  style={{ padding: '2rem 1.5rem', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="dropzone-icon" style={{ marginBottom: '0.75rem' }}>
                      <Upload size={36} />
                    </div>
                    {resumeFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                        <FileText size={18} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{resumeFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                          {dragActive ? "Drop PDF file here" : "Upload your CV (PDF)"}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Drag here or browse
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: Paste Job Description */}
              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>2. Target Job / Internship Description</h3>
                <div className="form-group" style={{ margin: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    className="form-textarea"
                    placeholder="Paste the job requirements, responsibilities, and target skills description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    style={{ flexGrow: 1, minHeight: '180px' }}
                  />
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.05rem' }}>
                <Sparkles size={20} /> Compare & Match Resume
              </button>
            </div>
          </form>

          {/* Semantic Matching Explainer */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} /> Semantic Matching Core Engine
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              The Job Target Matcher uses advanced natural language processing via Gemini AI to perform deep comparative mapping of your resume against the target description:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span> Keyword Extraction
                </span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Identifies primary software tools, hard and soft skills, methodologies, and credential keywords required by the employer.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block' }}></span> Experience Alignment
                </span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Calculates years of experience overlap and matches responsibility domains between past positions and new roles.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}></span> Bullet Tailoring
                </span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Generates precise phrasing recommendations using before-and-after copy structures to boost search compatibility scores.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matching Results View */}
      {result && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
        }} className="screener-results">

          {/* Left Column: Match Score Circular Indicator & Missing requirements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Radial Match Score gauge */}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--grad-glow)',
                opacity: 0.5,
                zIndex: 0
              }}></div>
              
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>Job Match Rating</h3>
                
                {/* SVG Radial Gauge */}
                <div className="radial-progress-wrapper" style={{ marginBottom: '1rem' }}>
                  <svg className="radial-progress-svg">
                    <circle className="radial-progress-bg" cx="80" cy="80" r="70" />
                    <circle 
                      className="radial-progress-bar" 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      style={{
                        strokeDasharray: 440,
                        strokeDashoffset: 440 - (440 * result.match_percentage) / 100,
                        stroke: `url(#progressGrad)`
                      }}
                    />
                  </svg>
                  <div className="radial-progress-text">
                    <span className="radial-progress-val">{result.match_percentage}</span>
                    <span className="radial-progress-pct">%</span>
                  </div>
                </div>

                <span className="badge" style={{
                  backgroundColor: getPercentageColor(result.match_percentage) + '20',
                  color: getPercentageColor(result.match_percentage),
                  border: `1px solid ${getPercentageColor(result.match_percentage)}40`,
                  padding: '0.35rem 1rem'
                }}>
                  {result.match_percentage >= 80 ? 'Strong Match' : result.match_percentage >= 55 ? 'Moderate Match' : 'Low Match'}
                </span>
              </div>
            </div>

            {/* Gap Analysis Summary */}
            {result.resume_gaps && result.resume_gaps.length > 0 && (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Award size={18} style={{ color: 'var(--accent)' }} /> Main Alignment Gaps
                </h3>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0 }}>
                  {result.resume_gaps.map((gap, idx) => (
                    <li key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Prerequisites */}
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
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0 }}>
                    {result.missing_requirements.map((req, idx) => (
                      <li key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Tailoring recommendations, keywords, course suggestions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Tailoring Recommendations */}
            <div className={`accordion-item ${openAccordions.tailor ? 'accordion-open' : ''}`}>
              <div className="accordion-header" onClick={() => toggleAccordion('tailor')}>
                <div className="accordion-header-left">
                  <span className="accordion-header-icon" style={{ color: 'var(--primary)' }}>
                    <Sparkles size={18} />
                  </span>
                  <span>Resume Phrasing Suggestions</span>
                </div>
                <ChevronDown size={18} className="accordion-header-arrow" />
              </div>
              
              {openAccordions.tailor && (
                <div className="accordion-content" style={{ paddingBottom: '0.25rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Rephrase these sections inside your resume to incorporate mandatory keywords and match the employer's phrasing:
                  </p>
                  
                  {result.tailoring_suggestions.map((suggestion, idx) => (
                    <div key={idx} className="tailor-suggestion-card">
                      <div className="tailor-section-tag">{suggestion.section}</div>
                      
                      <div className="tailor-diff">
                        <div className="diff-box diff-box-original" data-type="Original">
                          {suggestion.original_text}
                        </div>
                        <div className="diff-box diff-box-suggested" data-type="Suggested">
                          {suggestion.suggested_text}
                        </div>
                      </div>
                      
                      <div className="tailor-reason">
                        <strong>Strategy:</strong> {suggestion.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strengths Matching & Keywords to Add */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1rem'
            }} className="tailor-diff">
              
              {/* Strengths Match */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--success)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> Matching Strengths
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {result.strengths_matching.map((str, idx) => (
                    <span key={idx} className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      {str}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills to Add */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--warning)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} /> Keywords to Add
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {result.skills_to_add.map((skill, idx) => (
                    <span key={idx} className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Suggested Courses for specific matching gap */}
            {result.suggested_courses && result.suggested_courses.length > 0 && (
              <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <BookOpen size={20} style={{ color: 'var(--secondary)' }} /> Targeted Bridging Courses
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Quickly acquire missing qualifications requested in the job post:
                </p>
                
                <div className="course-grid">
                  {result.suggested_courses.map((course, idx) => (
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
            )}

          </div>

        </div>
      )}
    </div>
  );
};
