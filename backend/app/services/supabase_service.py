import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Usually the Service Role Key or Anon Key

# Initialize the Supabase client
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def verify_jwt_token(token: str) -> str:
    """
    Verifies the Supabase JWT token and returns the user's UUID.
    Raises an exception if the token is invalid.
    """
    if not supabase:
        raise ValueError("Supabase is not configured on the server.")
    
    try:
        # get_user automatically validates the JWT token with Supabase Auth
        res = supabase.auth.get_user(token)
        if res and res.user:
            return res.user.id
        raise ValueError("Could not resolve user details from token.")
    except Exception as e:
        raise ValueError(f"Authentication failed: {str(e)}")

def save_scan_history(user_id: str, filename: str, score: int, scan_type: str, result_data: dict) -> dict:
    """
    Saves a resume screening/matching assessment into the scan_history table.
    """
    if not supabase:
        raise ValueError("Supabase is not configured on the server.")

    try:
        data = {
            "user_id": user_id,
            "filename": filename,
            "score": score,
            "type": scan_type,
            "result_data": result_data
        }
        res = supabase.table("scan_history").insert(data).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return {}
    except Exception as e:
        raise RuntimeError(f"Database insert failed: {str(e)}")

def get_user_scan_history(user_id: str) -> list:
    """
    Fetches the scan history records for a specific authenticated user.
    """
    if not supabase:
        raise ValueError("Supabase is not configured on the server.")

    try:
        res = supabase.table("scan_history")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        return res.data or []
    except Exception as e:
        raise RuntimeError(f"Database query failed: {str(e)}")

def delete_user_scan_record(user_id: str, record_id: str) -> bool:
    """
    Deletes a specific scan history record belonging to the authenticated user.
    """
    if not supabase:
        raise ValueError("Supabase is not configured on the server.")

    try:
        # Enforce that the user owns the scan history record
        res = supabase.table("scan_history")\
            .delete()\
            .eq("id", record_id)\
            .eq("user_id", user_id)\
            .execute()
        return len(res.data) > 0
    except Exception as e:
        raise RuntimeError(f"Database delete failed: {str(e)}")

def save_user_profile(user_id: str, username: str) -> dict:
    """
    Registers or updates the user profile record in public.profiles.
    """
    if not supabase:
        raise ValueError("Supabase is not configured on the server.")

    try:
        data = {
            "id": user_id,
            "username": username
        }
        res = supabase.table("profiles").upsert(data).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return {}
    except Exception as e:
        raise RuntimeError(f"Failed to upsert profile: {str(e)}")
