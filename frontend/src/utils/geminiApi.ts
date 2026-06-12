export interface ScreeningResult {
  overall_score: number;
  summary: string;
  identified_skills?: string[];
  strengths: string[];
  weaknesses: string[];
  missing_skills: {
    skill: string;
    importance: 'high' | 'medium' | 'low';
  }[];
  improvement_suggestions: {
    title: string;
    details: string;
  }[];
  courses: {
    title: string;
    platform: string;
    link: string;
  }[];
  gaps: string[];
  formatting_feedback: string;
  career_path_gaps?: {
    current_role: string;
    intermediate_role: string;
    target_role: string;
    gaps: {
      type: 'skill' | 'experience';
      title: string;
      details: string;
    }[];
  };
}

export interface MatchResult {
  match_percentage: number;
  strengths_matching: string[];
  missing_requirements: string[];
  resume_gaps: string[];
  skills_to_add: string[];
  tailoring_suggestions: {
    section: string;
    original_text: string;
    suggested_text: string;
    reason: string;
  }[];
  suggested_courses: {
    title: string;
    platform: string;
    link: string;
  }[];
}
