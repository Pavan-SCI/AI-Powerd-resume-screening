import os
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from app.services.supabase_service import (
    verify_jwt_token,
    save_scan_history,
    get_user_scan_history,
    delete_user_scan_record,
    save_user_profile,
    get_user_email_from_token
)
from app.services.gemini_service import screen_resume_ai, match_resume_to_job_ai

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "pavanwish2002@gmail.com").lower()

app = FastAPI(
    title="ResumeCraft AI Backend",
    description="Python FastAPI backend serving Gemini AI models and Supabase databases.",
    version="1.0.0"
)

# Enable CORS for frontend client development servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to actual frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to verify token and return user ID
def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format. Must be Bearer <token>")
    
    token = parts[1]
    try:
        user_id = verify_jwt_token(token)
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

def get_current_user_email(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required.")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format. Must be Bearer <token>")
    
    token = parts[1]
    try:
        email = get_user_email_from_token(token)
        return email
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# Request Schemas
class ScreenResumeRequest(BaseModel):
    resume_text: str
    filename: str
    model: str = "gemini-2.5-flash"

class MatchJobRequest(BaseModel):
    resume_text: str
    filename: str
    job_description: str
    model: str = "gemini-2.5-flash"

class ProfileUpsertRequest(BaseModel):
    username: str

class UpdateApiKeyRequest(BaseModel):
    gemini_api_key: str

@app.get("/")
def read_root():
    return {"message": "Welcome to ResumeCraft AI Backend API", "status": "online"}

@app.post("/api/profile")
def upsert_profile(req: ProfileUpsertRequest, user_id: str = Depends(get_current_user_id)):
    try:
        profile = save_user_profile(user_id, req.username)
        return {"success": True, "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/config")
def get_admin_config(email: str = Depends(get_current_user_email)):
    if email.lower() != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required.")
    
    key = os.getenv("GEMINI_API_KEY", "")
    masked_key = ""
    if key:
        if len(key) > 8:
            masked_key = key[:4] + "••••" + key[-4:]
        else:
            masked_key = "••••••••"
    return {"gemini_api_key": masked_key}

@app.post("/api/admin/config")
def update_admin_config(req: UpdateApiKeyRequest, email: str = Depends(get_current_user_email)):
    if email.lower() != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required.")
    
    new_key = req.gemini_api_key.strip()
    if not new_key:
        raise HTTPException(status_code=400, detail="Gemini API Key cannot be empty.")
    
    # 1. Update in-memory config
    os.environ["GEMINI_API_KEY"] = new_key
    import google.generativeai as genai
    genai.configure(api_key=new_key)
    
    # 2. Write persistently to .env file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(current_dir, "..", ".env")
    
    try:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        new_lines = []
        key_found = False
        for line in lines:
            if line.strip().startswith("GEMINI_API_KEY="):
                new_lines.append(f"GEMINI_API_KEY={new_key}\n")
                key_found = True
            else:
                new_lines.append(line)
        
        if not key_found:
            new_lines.append(f"GEMINI_API_KEY={new_key}\n")
            
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
            
        return {"success": True, "message": "Gemini API key updated successfully on the server."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update config: {str(e)}")

@app.post("/api/screen-resume")
def screen_resume_endpoint(req: ScreenResumeRequest, user_id: str = Depends(get_current_user_id)):
    try:
        # 1. Run evaluation with Gemini API
        screening_result = screen_resume_ai(req.resume_text, req.model)
        
        # 2. Save result to Supabase
        score = screening_result.get("overall_score", 0)
        save_scan_history(
            user_id=user_id,
            filename=req.filename,
            score=score,
            scan_type="screen",
            result_data=screening_result
        )
        
        return screening_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/match-job")
def match_job_endpoint(req: MatchJobRequest, user_id: str = Depends(get_current_user_id)):
    try:
        # 1. Run matching assessment with Gemini API
        match_result = match_resume_to_job_ai(req.resume_text, req.job_description, req.model)
        
        # 2. Save result to Supabase
        score = match_result.get("match_percentage", 0)
        save_scan_history(
            user_id=user_id,
            filename=req.filename,
            score=score,
            scan_type="match",
            result_data=match_result
        )
        
        return match_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history(user_id: str = Depends(get_current_user_id)):
    try:
        history = get_user_scan_history(user_id)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history/{record_id}")
def delete_record(record_id: str, user_id: str = Depends(get_current_user_id)):
    try:
        deleted = delete_user_scan_record(user_id, record_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Scan record not found or unauthorized.")
        return {"success": True, "message": "Record deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
