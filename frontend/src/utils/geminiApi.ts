export interface SkillItem {
  skill: string;
  importance: 'high' | 'medium' | 'low';
}

export interface SuggestionItem {
  title: string;
  details: string;
}

export interface CourseItem {
  title: string;
  platform: string;
  link: string;
}

export interface ScreeningResult {
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_skills: SkillItem[];
  improvement_suggestions: SuggestionItem[];
  courses: CourseItem[];
  gaps: string[];
  formatting_feedback: string;
}

export interface TailoringSuggestion {
  section: string;
  original_text: string;
  suggested_text: string;
  reason: string;
}

export interface MatchResult {
  match_percentage: number;
  strengths_matching: string[];
  missing_requirements: string[];
  resume_gaps: string[];
  skills_to_add: string[];
  tailoring_suggestions: TailoringSuggestion[];
  suggested_courses: CourseItem[];
}

// Simulated mock screening response for Demo Mode
const MOCK_SCREENING_RESPONSE: ScreeningResult = {
  overall_score: 76,
  summary: "The candidate shows a strong foundation in modern frontend web development, specializing in React, TypeScript, and state management. However, the resume lacks solid details on backend development integration, automated testing strategies, and modern cloud deployment architectures.",
  strengths: [
    "Solid professional experience with React (including hooks, context, and state optimization).",
    "Strong usage of TypeScript for type-safety across commercial projects.",
    "Good formatting hierarchy and clear chronological work history."
  ],
  weaknesses: [
    "No unit testing or integration testing libraries (e.g., Jest, React Testing Library) are mentioned.",
    "Lacks mentions of containerization tools like Docker or CI/CD integration.",
    "Very limited mention of databases or backend systems, making them less versatile for full-stack tasks."
  ],
  missing_skills: [
    { skill: "Jest / Vitest", importance: "high" },
    { skill: "Docker", importance: "medium" },
    { skill: "CI/CD (GitHub Actions / GitLab)", importance: "high" },
    { skill: "AWS / Vercel Deployments", importance: "medium" },
    { skill: "SQL / PostgreSQL / MongoDB", importance: "low" }
  ],
  improvement_suggestions: [
    {
      title: "Integrate testing frameworks",
      details: "Add a testing section or detail how you wrote unit tests using Vitest or Jest. Modern engineering teams prioritize testing, and showcasing this on a CV boosts selection chances."
    },
    {
      title: "Highlight containerization & automation",
      details: "Add bullet points explaining how you containerized applications for consistency across environments or how you set up automated workflows using GitHub Actions."
    },
    {
      title: "Clarify system design metrics",
      details: "Instead of saying 'Improved app performance', add specific quantifiers like 'Reduced initial bundle load time by 35% through code splitting and lazy loading.'"
    }
  ],
  courses: [
    {
      title: "Testing React with Jest and React Testing Library",
      platform: "Udemy",
      link: "https://www.udemy.com/topic/jest-testing/"
    },
    {
      title: "Docker and Kubernetes: The Complete Guide",
      platform: "Coursera / Udemy",
      link: "https://www.coursera.org/search?query=docker"
    },
    {
      title: "GitHub Actions: Continuous Integration and Deployment (CI/CD)",
      platform: "Pluralsight",
      link: "https://www.coursera.org/search?query=github%20actions"
    }
  ],
  gaps: [
    "Career gap of 5 months between Nov 2024 and Apr 2025. Adding a brief note explaining if this was spent on professional upskilling, freelancing, or personal projects is advised.",
    "No educational qualifications are mentioned in detail (only a high school entry). Include details of any university degrees, bootcamps, or ongoing certification pathways."
  ],
  formatting_feedback: "The overall layout is well-structured and reads chronologically from newest to oldest. However, the contact section is missing an active LinkedIn URL. Ensure font size consistency in subsections (e.g., 'Projects' sub-headings are slightly larger than 'Work Experience' sub-headings)."
};

// Simulated mock job matching response for Demo Mode
const MOCK_MATCH_RESPONSE: MatchResult = {
  match_percentage: 68,
  strengths_matching: [
    "React (hooks, styling, performance optimization)",
    "TypeScript type structures",
    "Version control using Git"
  ],
  missing_requirements: [
    "2+ years experience building Node.js Express APIs",
    "Familiarity with AWS (S3, EC2, CloudFront)",
    "Understanding of relational databases (PostgreSQL/MySQL)"
  ],
  resume_gaps: [
    "The job description explicitly calls for a 'Full-Stack Developer', whereas the resume is heavily focused on frontend elements. There are no backend projects or skills listed."
  ],
  skills_to_add: [
    "Node.js",
    "Express.js",
    "PostgreSQL",
    "Amazon Web Services (AWS)",
    "RESTful API design"
  ],
  tailoring_suggestions: [
    {
      section: "Professional Summary",
      original_text: "Enthusiastic React Developer with 3 years of building engaging UI dashboards.",
      suggested_text: "Full-Stack Developer with 3+ years of experience building scalable React user interfaces and integration layers, leveraging Node.js backend services.",
      reason: "Aligns the intro summary directly with the 'Full-Stack' job title requirement."
    },
    {
      section: "Projects (E-Commerce Platform)",
      original_text: "Designed and implemented the checkout screen UI using React.",
      suggested_text: "Designed and implemented checkout interfaces in React; co-authored Node.js microservices and database queries to process transactional checkout workflows securely.",
      reason: "Demonstrates full-stack database and backend participation requested by the employer."
    },
    {
      section: "Technical Skills",
      original_text: "JavaScript, React, CSS, HTML, TypeScript.",
      suggested_text: "Languages & Frameworks: JavaScript, TypeScript, React, Node.js, Express.js. Databases: PostgreSQL, SQLite. Cloud: AWS S3.",
      reason: "Visually lists the mandatory backend technologies matching the job specs."
    }
  ],
  suggested_courses: [
    {
      title: "Node.js, Express, MongoDB & More: The Complete Bootcamp",
      platform: "Udemy",
      link: "https://www.udemy.com/topic/nodejs/"
    },
    {
      title: "Ultimate AWS Certified Cloud Practitioner Course",
      platform: "Coursera",
      link: "https://www.coursera.org/search?query=aws%20cloud%20practitioner"
    }
  ]
};

/**
 * Screen a single resume text using Gemini API
 */
export async function screenResume(
  resumeText: string,
  apiKey: string,
  model: string = 'gemini-2.5-flash',
  isDemoMode: boolean = false
): Promise<ScreeningResult> {
  if (isDemoMode) {
    // Artificial latency for realism
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return MOCK_SCREENING_RESPONSE;
  }

  if (!apiKey) {
    throw new Error('Gemini API key is required. Please check settings.');
  }

  const prompt = `
You are a highly experienced HR recruiter and expert resume screening agent.
Analyze the following resume text and provide a structured assessment of its quality, strengths, weaknesses, gaps, missing skills, and actionable ways to improve.

Resume Text:
"""
${resumeText}
"""

You MUST respond ONLY with a JSON object. Ensure the JSON conforms exactly to this structure:
{
  "overall_score": <number from 0 to 100 representing resume strength>,
  "summary": "<a short 2-3 sentence overview of the candidate profile>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "missing_skills": [
    { "skill": "<skill name>", "importance": "high" | "medium" | "low" }
  ],
  "improvement_suggestions": [
    { "title": "<short visual title>", "details": "<actionable explanation of how to write or improve this item on the resume>" }
  ],
  "courses": [
    { "title": "<real or highly relevant course name to fill missing skills>", "platform": "<Udemy | Coursera | LinkedIn Learning etc>", "link": "<a simple platform search query url or typical learning platform url>" }
  ],
  "gaps": ["<gaps such as career gaps, missing education details, lack of certification details, etc.>"],
  "formatting_feedback": "<constructive feedback about fonts, contact details, layout structure, etc.>"
}

Do not include any Markdown wrap (like \`\`\`json) or text before or after the JSON.
`;

  try {
    const result = await callGeminiApi(model, prompt, apiKey);
    return JSON.parse(result) as ScreeningResult;
  } catch (error) {
    console.error('Screening API error:', error);
    throw new Error(`Screening failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Compare resume text against job description text using Gemini API
 */
export async function matchResumeToJob(
  resumeText: string,
  jobDescriptionText: string,
  apiKey: string,
  model: string = 'gemini-2.5-flash',
  isDemoMode: boolean = false
): Promise<MatchResult> {
  if (isDemoMode) {
    // Artificial latency for realism
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return MOCK_MATCH_RESPONSE;
  }

  if (!apiKey) {
    throw new Error('Gemini API key is required. Please check settings.');
  }

  const prompt = `
You are a career consultant and recruiter.
Analyze the following Resume and compare it to the target Job/Internship Description. Provide an evaluation, matching score, missing qualifications list, and specific resume tailoring suggestions.

Resume Text:
"""
${resumeText}
"""

Job/Internship Description:
"""
${jobDescriptionText}
"""

You MUST respond ONLY with a JSON object conforming exactly to this structure:
{
  "match_percentage": <number from 0 to 100 indicating match rating>,
  "strengths_matching": ["<specific matching capability 1>", "<specific matching capability 2>", ...],
  "missing_requirements": ["<explicit job requirement not shown in CV 1>", "<explicit job requirement not shown in CV 2>", ...],
  "resume_gaps": ["<key gap in alignment, e.g., missing specific project experience, target title discrepancy>"],
  "skills_to_add": ["<essential keywords/skills to include in skill bank if candidate has them>"],
  "tailoring_suggestions": [
    {
      "section": "<e.g., Professional Summary, Experience - [Job Title], Projects>",
      "original_text": "<the current sub-optimal bullet point or text in the resume>",
      "suggested_text": "<revised text incorporating keywords or explaining projects to highlight matching qualities>",
      "reason": "<explanation of why this suggestion aligns better with the target description>"
    }
  ],
  "suggested_courses": [
    { "title": "<targeted course name to bridge the missing requirement>", "platform": "<platform name>", "link": "<platform search URL>" }
  ]
}

Do not include any Markdown wrap (like \`\`\`json) or text before or after the JSON.
`;

  try {
    const result = await callGeminiApi(model, prompt, apiKey);
    return JSON.parse(result) as MatchResult;
  } catch (error) {
    console.error('Matching API error:', error);
    throw new Error(`Job matching failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Underlying helper function to invoke the Gemini HTTP API
 */
async function callGeminiApi(model: string, prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errorMessage = errorJson?.error?.message || `HTTP status ${response.status}`;
    throw new Error(`Gemini API Error: ${errorMessage}`);
  }

  const responseJson = await response.json();
  const rawText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!rawText) {
    throw new Error('Received an empty response from the AI model.');
  }

  return rawText.trim();
}
