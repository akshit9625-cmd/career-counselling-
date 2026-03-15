import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from aiosqlite import Connection

from app.database import get_db
from app.schemas.schemas import UserCreate, UserOut, ProfileUpsert, ProfileOut

router = APIRouter()

@router.post("/users", response_model=UserOut)
async def create_user(payload: UserCreate, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE email = ?", (payload.email,)) as cur:
        existing = await cur.fetchone()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.execute("INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)",
        (user_id, payload.name, payload.email, now))
    await db.commit()
    return UserOut(id=user_id, name=payload.name, email=payload.email,
                   created_at=datetime.fromisoformat(now))

@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserOut(**dict(row))

@router.put("/users/{user_id}/profile", response_model=ProfileOut)
async def upsert_profile(user_id: str, payload: ProfileUpsert, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM users WHERE id = ?", (user_id,)) as cur:
        user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    now = datetime.now(timezone.utc).isoformat()
    skills_json = json.dumps(payload.skills or [])
    interests_json = json.dumps(payload.interests or [])
    await db.execute("""
        INSERT INTO user_profiles (user_id, current_role, years_experience, education,
                                   skills, interests, career_goals, location, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            current_role = excluded.current_role,
            years_experience = excluded.years_experience,
            education = excluded.education,
            skills = excluded.skills,
            interests = excluded.interests,
            career_goals = excluded.career_goals,
            location = excluded.location,
            updated_at = excluded.updated_at
    """, (user_id, payload.current_role, payload.years_experience, payload.education,
            skills_json, interests_json, payload.career_goals, payload.location, now))
    await db.commit()
    return ProfileOut(user_id=user_id, current_role=payload.current_role,
        years_experience=payload.years_experience, education=payload.education,
        skills=payload.skills, interests=payload.interests,
        career_goals=payload.career_goals, location=payload.location,
        updated_at=datetime.fromisoformat(now))

@router.get("/users/{user_id}/profile", response_model=ProfileOut)
async def get_profile(user_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found.")
    data = dict(row)
    data["skills"] = json.loads(data.get("skills") or "[]")
    data["interests"] = json.loads(data.get("interests") or "[]")
    return ProfileOut(**data)
