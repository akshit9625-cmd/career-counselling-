import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from aiosqlite import Connection

from app.database import get_db
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.ai_service import get_ai_response

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def send_message(payload: ChatRequest, db: Connection = Depends(get_db)):
    async with db.execute(
        "SELECT id FROM sessions WHERE id = ? AND user_id = ?",
        (payload.session_id, payload.user_id),
    ) as cur:
        session = await cur.fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    async with db.execute(
        """SELECT up.*, u.name FROM user_profiles up
           JOIN users u ON u.id = up.user_id
           WHERE up.user_id = ?""",
        (payload.user_id,),
    ) as cur:
        row = await cur.fetchone()
    profile = dict(row) if row else None

    async with db.execute(
        "SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC",
        (payload.session_id,),
    ) as cur:
        rows = await cur.fetchall()
    history = [{"role": r["role"], "content": r["content"]} for r in rows]
    history.append({"role": "user", "content": payload.message})

    user_msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_msg_id, payload.session_id, "user", payload.message, now),
    )

    try:
        reply_text = await get_ai_response(history, profile)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    asst_msg_id = str(uuid.uuid4())
    reply_at = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
        (asst_msg_id, payload.session_id, "assistant", reply_text, reply_at),
    )
    await db.execute(
        "UPDATE sessions SET updated_at = ? WHERE id = ?",
        (reply_at, payload.session_id),
    )
    await db.commit()

    return ChatResponse(
        session_id=payload.session_id,
        message_id=asst_msg_id,
        reply=reply_text,
        created_at=datetime.fromisoformat(reply_at),
    )