import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def screen_resume_ai(resume_text: str, model_name: str = "gemini-2.5-flash") -> dict:
    """
    Calls Gemini API to evaluate/screen resume text.
    """
    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key is not configured on the server.")

    prompt = f"""
You are a highly experienced HR recruiter and expert resume screening agent.
Analyze the following resume text and provide a structured assessment of its quality, strengths, weaknesses, gaps, missing skills, and actionable ways to improve.

CRITICAL EVALUATION RULES:
1. Input Validation: Detect if the input text is a valid Resume / CV. A cover letter is NOT a resume/CV. If the input text is a cover letter, an empty document, a short phrase/sentence, a job description, or unrelated text, you MUST assign an "overall_score" of 0. Do NOT evaluate non-resume documents as resumes.
2. Be strict and realistic: Do not default to high scores like 70%. Be extremely critical and realistic. Average resumes should score between 40% and 65%. Only exceptional, highly detailed professional resumes with clear achievements, impact, metrics, and clean structure should score 70% or above.
3. If it is a cover letter: A cover letter lacks standard resume structures (work history, education, specific skills lists, structure). Assign an "overall_score" of 0.
4. Evaluate strictly on completeness, experience quality, skills representation, formatting, and overall impact.
5. Deterministic & Factual Scoring Formula: To ensure absolute consistency and fairness (so identical inputs yield identical scores, and the score does justice to the CV content), you MUST calculate the "overall_score" using this exact math based on the resume contents:
   - Experience (up to 50 points): Award 10 points per year of relevant professional work experience (max 50 points).
   - Skills (up to 30 points): Award 3 points per valid technical or professional skill listed in the resume (max 30 points).
   - Education & Certifications (up to 20 points): Award 10 points for a completed college degree, and 5 points per professional certification (max 20 points).
   Sum these three values to get the final "overall_score" (integer between 0 and 100). If the document is a cover letter or invalid, set the score to 0.

COURSE SUGGESTIONS RULE:
- Do not limit the list of recommended courses to 3. Provide as many relevant, high-quality, real courses as necessary to bridge the identified missing skills/gaps (list them all in the "courses" field).

Resume Text:
\"\"\"
{resume_text}
\"\"\"

You MUST respond ONLY with a JSON object. Ensure the JSON conforms exactly to this structure:
{{
  "overall_score": <number from 0 to 100 representing resume strength based on the rules above>,
  "summary": "<a short 2-3 sentence overview of the candidate profile>",
  "identified_skills": ["<key skill found in resume 1>", "<key skill found in resume 2>", ...],
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "missing_skills": [
    {{ "skill": "<skill name>", "importance": "high" | "medium" | "low" }}
  ],
  "improvement_suggestions": [
    {{ "title": "<short visual title>", "details": "<actionable explanation of how to write or improve this item on the resume>" }}
  ],
  "courses": [
    {{ "title": "<real or highly relevant course name to fill missing skills>", "platform": "<Udemy | Coursera | LinkedIn Learning etc>", "link": "<a simple platform search query url or typical learning platform url>" }}
  ],
  "gaps": ["<gaps such as career gaps, missing education details, lack of certification details, etc.>"],
  "formatting_feedback": "<constructive feedback about fonts, contact details, layout structure, etc.>",
  "career_path_gaps": {{
    "current_role": "<candidate's current or most recent job title from CV, e.g. Software Developer>",
    "intermediate_role": "<suggested intermediate next-step title, e.g. Career Architect>",
    "target_role": "<suggested long-term target role title, e.g. Cloud Architect>",
    "gaps": [
      {{ "type": "skill", "title": "Skill Gap: NoSQL", "details": "No references to non-relational database management systems (NoSQL) found in work history." }},
      {{ "type": "skill", "title": "Still Gap: SQL", "details": "Minimal advanced query optimization or SQL schema scaling details found on the CV." }},
      {{ "type": "experience", "title": "Experience Gap", "details": "Lacks required experience managing cloud systems architectures or DevOps CI/CD." }}
    ]
  }}
}}

Do not include any Markdown wrap (like ```json) or text before or after the JSON.
"""

    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.0,
                "top_p": 0.0,
                "top_k": 1
            }
        )
        return json.loads(response.text.strip())
    except Exception as e:
        raise RuntimeError(f"Gemini API failure during screening: {str(e)}")

def match_resume_to_job_ai(resume_text: str, job_description: str, model_name: str = "gemini-2.5-flash") -> dict:
    """
    Calls Gemini API to match resume text to a job description.
    """
    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key is not configured on the server.")

    prompt = f"""
You are a career consultant and recruiter.
Analyze the following Resume and compare it to the target Job/Internship Description. Provide an evaluation, matching score, missing qualifications list, and specific resume tailoring suggestions.

CRITICAL EVALUATION & MATCHING RULES:
1. Input Validation: Detect if the input resume text is a valid Resume / CV. A cover letter is NOT a resume/CV. If the input resume text is a cover letter, an empty document, a short phrase/sentence, or unrelated text, you MUST assign a "match_percentage" of 0. Do NOT evaluate non-resume documents as resumes.
2. Be strict and realistic: Do not default to high percentages (like 70%) unless the candidate is a strong, direct fit for the specific job description. If key requirements, skills, or experience are missing, reflect this accurately in a lower matching score (e.g., 10% to 50%).
3. If it is a cover letter: A cover letter lacks standard resume structures (work history, education, specific skills lists). Assign a "match_percentage" of 0.
4. Evaluate strictly based on how well the candidate's skills, experience, and qualifications match the target job description.
5. Deterministic & Factual Matching Formula: To ensure absolute consistency and fairness, you MUST calculate the "match_percentage" using this exact math based on the resume and job description:
   - Required Skills Match (up to 50 points): Calculate the percentage of required skills from the job description that are present in the resume, and multiply by 0.5 (max 50 points).
   - Experience Level Match (up to 30 points): Award 30 points if the candidate meets or exceeds the required years of experience. Otherwise, award a proportional score (e.g., if requires 4 years and has 2 years, award 15 points).
   - Domain & Education Match (up to 20 points): Award 10 points if the candidate's domain/industry aligns, and 10 points if their education matches the job requirements (max 20 points).
   Sum these three values to get the final "match_percentage" (integer between 0 and 100). If the resume is invalid or a cover letter, set the match percentage to 0.

COURSE SUGGESTIONS RULE:
- Do not limit the list of recommended courses to 3. Provide as many relevant, high-quality, real courses as necessary to bridge the identified missing requirements (list them all in the "suggested_courses" field).

Resume Text:
\"\"\"
{resume_text}
\"\"\"

Job/Internship Description:
\"\"\"
{job_description}
\"\"\"

You MUST respond ONLY with a JSON object conforming exactly to this structure:
{{
  "match_percentage": <number from 0 to 100 indicating match rating based on the rules above>,
  "strengths_matching": ["<specific matching capability 1>", "<specific matching capability 2>", ...],
  "missing_requirements": ["<explicit job requirement not shown in CV 1>", "<explicit job requirement not shown in CV 2>", ...],
  "resume_gaps": ["<key gap in alignment, e.g., missing specific project experience, target title discrepancy>"],
  "skills_to_add": ["<essential keywords/skills to include in skill bank if candidate has them>"],
  "tailoring_suggestions": [
    {{
      "section": "<e.g., Professional Summary, Experience - [Job Title], Projects>",
      "original_text": "<the current sub-optimal bullet point or text in the resume>",
      "suggested_text": "<revised text incorporating keywords or explaining projects to highlight matching qualities>",
      "reason": "<explanation of why this suggestion aligns better with the target description>"
    }}
  ],
  "suggested_courses": [
    {{ "title": "<targeted course name to bridge the missing requirement>", "platform": "<platform name>", "link": "<platform search URL>" }}
  ]
}}

Do not include any Markdown wrap (like ```json) or text before or after the JSON.
"""

    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.0,
                "top_p": 0.0,
                "top_k": 1
            }
        )
        return json.loads(response.text.strip())
    except Exception as e:
        raise RuntimeError(f"Gemini API failure during matching: {str(e)}")
