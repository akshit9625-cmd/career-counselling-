import json
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.models import Session, UserProfile
from app.schemas import (
    ResumeReviewRequest, ResumeReviewResponse,
    InterviewPrepRequest, InterviewPrepResponse,
    CareerAdviceResponse,
)
from app.services.ai_service import get_career_advice_ai

router = APIRouter()


def _safe_parse_json(text: str) -> dict:
    """Strip markdown fences and parse JSON from AI response."""
    cleaned = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return json.loads(cleaned)




@router.post("/resume-review", response_model=ResumeReviewResponse)
async def review_resume(payload: ResumeReviewRequest, db: DBSession = Depends(get_db)):
    """
    Submit resume text for AI-powered analysis.
    Returns strengths, improvement areas, actionable suggestions, and a score out of 10.
    """
    session = db.query(Session).filter(Session.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    prompt = f"""
You are an expert resume reviewer and career counsellor.

Analyse the following resume and respond ONLY with a valid JSON object (no markdown, no extra text) 
in this exact format:
{{
  "strengths": ["...", "..."],
  "areas_for_improvement": ["...", "..."],
  "suggestions": ["...", "..."],
  "overall_score": <integer 1-10>
}}

Resume:
{payload.resume_text}
"""
    raw = await get_career_advice_ai(prompt)

    try:
        data = _safe_parse_json(raw)
        return ResumeReviewResponse(**data)
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI returned an unexpected format. Raw response: {raw[:300]}",
        )




@router.post("/interview-prep", response_model=InterviewPrepResponse)
async def interview_prep(payload: InterviewPrepRequest, db: DBSession = Depends(get_db)):
    """
    Generate targeted interview questions and tips for a specific role and interview type.
    Interview types: behavioral | technical | hr
    """
    session = db.query(Session).filter(Session.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    prompt = f"""
You are an expert interview coach.

Generate interview preparation material for a candidate applying for: {payload.target_role}
Interview type: {payload.interview_type}

Respond ONLY with a valid JSON object (no markdown, no extra text) in this exact format:
{{
  "target_role": "{payload.target_role}",
  "interview_type": "{payload.interview_type}",
  "questions": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4"]
}}
"""
    raw = await get_career_advice_ai(prompt)

    try:
        data = _safe_parse_json(raw)
        return InterviewPrepResponse(**data)
    except (json.JSONDecodeError, KeyError, TypeError):
        raise HTTPException(status_code=500, detail=f"Unexpected AI response format: {raw[:300]}")




@router.get("/career-paths/{session_id}", response_model=CareerAdviceResponse)
async def get_career_paths(session_id: str, db: DBSession = Depends(get_db)):
    """
    Generate personalised career path recommendations based on the user's saved profile.
    Requires a profile to be created for the session first.
    """
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    profile = db.query(UserProfile).filter(UserProfile.session_id == session_id).first()
    if not profile:
        raise HTTPException(
            status_code=400,
            detail="No profile found for this session. Create a profile first via POST /sessions/{session_id}/profile",
        )

    profile_summary = f"""
Education: {profile.education_level or 'Not specified'}
Field of study: {profile.field_of_study or 'Not specified'}
Current role: {profile.current_role or 'Not specified'}
Years of experience: {profile.years_of_experience if profile.years_of_experience is not None else 'Not specified'}
Skills: {', '.join(profile.skills) if profile.skills else 'Not specified'}
Interests: {', '.join(profile.interests) if profile.interests else 'Not specified'}
Goals: {profile.goals or 'Not specified'}
"""

    prompt = f"""
You are an expert career counsellor. Based on the user profile below, recommend suitable career paths.

{profile_summary}

Respond ONLY with valid JSON (no markdown) in this exact format:
{{
  "career_paths": [
    {{
      "title": "Job Title",
      "description": "What this role involves",
      "typical_salary_range": "$X - $Y per year",
      "required_skills": ["skill1", "skill2"],
      "growth_outlook": "Growing / Stable / Declining"
    }}
  ],
  "recommended_resources": ["resource 1", "resource 2", "resource 3"],
  "next_steps": ["step 1", "step 2", "step 3"]
}}
Provide 3 career path options.
"""
    raw = await get_career_advice_ai(prompt)

    try:
        data = _safe_parse_json(raw)
        return CareerAdviceResponse(**data)
    except (json.JSONDecodeError, KeyError, TypeError):
        raise HTTPException(status_code=500, detail=f"Unexpected AI response format: {raw[:300]}")




@router.get("/tips/{topic}")
async def get_career_tips(topic: str):
    """
    Get quick career tips on a given topic.
    Example topics: networking, salary-negotiation, remote-work, career-change, linkedin
    """
    prompt = f"""
Give 5 concise, actionable career tips about: {topic}

Respond ONLY with valid JSON (no markdown):
{{
  "topic": "{topic}",
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
}}
"""
    raw = await get_career_advice_ai(prompt)

    try:
        return _safe_parse_json(raw)
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(status_code=500, detail=f"Unexpected AI response: {raw[:200]}")
