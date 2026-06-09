import { FileText, Award, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  totalAnalyzed: number;
  averageScore: number;
  selectedModel: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  totalAnalyzed,
  averageScore,
  selectedModel
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      {/* Header Greeting */}
      <div>
        <h1>Welcome to ResumeCraft AI</h1>
        <p className="subtitle">Optimize your resumes and match them against jobs using industry-grade AI analysis</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-val">{totalAnalyzed}</span>
            <span className="stat-lbl">Resumes Scanned</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-val">{averageScore > 0 ? `${averageScore}%` : 'N/A'}</span>
            <span className="stat-lbl">Avg. Screening Score</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Cpu size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-val" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {selectedModel.replace('gemini-', '').toUpperCase()}
            </span>
            <span className="stat-lbl">AI Core Engine</span>
          </div>
        </div>
      </div>

      {/* Main Core Features Grid */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Get Started</h2>
        <div className="features-grid">
          {/* Resume Screener Shortcut */}
          <div className="feature-box">
            <div className="feature-icon">
              <FileText size={28} />
            </div>
            <h3>Resume Screener</h3>
            <p>Upload your resume (PDF) to receive an overall score, detailed shortcomings, missing skills analysis, work experience gaps, and targeted courses to improve.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('screener')}>
              Screen Resume <ArrowRight size={18} />
            </button>
          </div>

          {/* Job Target Matcher Shortcut */}
          <div className="feature-box">
            <div className="feature-icon">
              <Award size={28} />
            </div>
            <h3>Job Target Matcher</h3>
            <p>Compare your resume side-by-side with a target job or internship description. Get a match score, missing prerequisites checklist, and detailed before-and-after phrasing suggestions.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('matcher')}>
              Match & Tailor <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tips Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginTop: '1rem', background: 'rgba(139, 92, 246, 0.03)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} /> Pro Tips for ATS Screeners
        </h3>
        <ul style={{
          listStyleType: 'none',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '0.75rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 900 }}>•</span>
            <span>Always save your resume in a standard <strong>PDF text format</strong>. Avoid scanned images or PDF-from-images as text extraction cannot parse them.</span>
          </li>
          <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 900 }}>•</span>
            <span>Integrate the recommended keywords and skills organically inside your work experiences rather than just dumping them in a 'Skills' bank.</span>
          </li>
          <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 900 }}>•</span>
            <span>Explain achievements using standard metric formulas: <strong>Accomplished [X] as measured by [Y] by doing [Z]</strong>.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
