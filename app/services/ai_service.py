import httpx
import os
from typing import List, Dict, Optional

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.1-8b-instant"

SYSTEM_PROMPT = """You are an expert career counsellor with 20+ years of experience.
Help users with career planning, transitions, interviews, salary negotiation, skill gaps, and professional development.
Be warm, encouraging, and give concrete actionable advice. Use bullet points where helpful."""

def build_system_prompt(profile: Optional[Dict] = None) -> str:
    if not profile:
        return SYSTEM_PROMPT
    ctx = SYSTEM_PROMPT + "\n\n--- USER PROFILE ---"
    if profile.get("name"):             ctx += f"\nName: {profile['name']}"
    if profile.get("current_role"):     ctx += f"\nRole: {profile['current_role']}"
    if profile.get("years_experience"): ctx += f"\nExperience: {profile['years_experience']} years"
    if profile.get("education"):        ctx += f"\nEducation: {profile['education']}"
    if profile.get("career_goals"):     ctx += f"\nGoals: {profile['career_goals']}"
    if profile.get("location"):         ctx += f"\nLocation: {profile['location']}"
    ctx += "\n--- END PROFILE ---\nPersonalise your advice based on this profile."
    return ctx

async def get_ai_response(
    conversation_history: List[Dict[str, str]],
    profile: Optional[Dict] = None,
) -> str:
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable is not set.")

    system = build_system_prompt(profile)
    messages = [{"role": "system", "content": system}]
    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.7,
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(GROQ_URL, json=payload, headers=headers)
        print("STATUS:", response.status_code)
        print("RESPONSE:", response.text[:300])
        response.raise_for_status()

    return response.json()["choices"][0]["message"]["content"].strip()

async def get_career_advice_ai(prompt: str) -> str:
    return await get_ai_response([{"role": "user", "content": prompt}])
