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

Resume Text:
\"\"\"
{resume_text}
\"\"\"

You MUST respond ONLY with a JSON object. Ensure the JSON conforms exactly to this structure:
{{
  "overall_score": <number from 0 to 100 representing resume strength>,
  "summary": "<a short 2-3 sentence overview of the candidate profile>",
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
  "formatting_feedback": "<constructive feedback about fonts, contact details, layout structure, etc.>"
}}

Do not include any Markdown wrap (like ```json) or text before or after the JSON.
"""

    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.2}
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
  "match_percentage": <number from 0 to 100 indicating match rating>,
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
            generation_config={"response_mime_type": "application/json", "temperature": 0.2}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        raise RuntimeError(f"Gemini API failure during matching: {str(e)}")
