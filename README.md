# Career Counselling Chatbot — FastAPI Backend

A production-ready REST API backend for an AI-powered career counselling chatbot

---

## Features

- 🤖 **Conversational AI** — Multi-turn chat with full session history and personalised context
- 👤 **User Profiles** — Store education, skills, interests, and goals to personalise advice
- 📄 **Resume Review** — AI-powered resume analysis with scores and suggestions
- 🎯 **Interview Prep** — Role-specific interview questions and coaching tips
- 🗺️ **Career Path Recommendations** — Personalised career path suggestions based on profile
- 💡 **Quick Tips** — On-demand tips for networking, salary negotiation, and more
- 🗄️ **Persistent Storage** — SQLite (easily swappable to PostgreSQL)

---

## Project Structure

```
career_counsellor/
├── main.py                     # FastAPI app entry point
├── requirements.txt
├── .env.example
└── app/
    ├── __init__.py
    ├── database.py             # SQLAlchemy setup + session factory
    ├── models.py               # ORM models: Session, Message, UserProfile
    ├── schemas.py              # Pydantic request/response schemas
    ├── services/
    │   └── ai_service.py       # Anthropic Claude API integration
    └── routers/
        ├── chat.py             # POST /chat/message, GET /chat/history/{id}
        ├── sessions.py         # Session + UserProfile CRUD
        └── career.py           # Resume review, interview prep, career paths
```

---

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env

```

### 3. Run the server
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

---

## API Reference

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/sessions/` | Create a new session |
| `GET` | `/api/v1/sessions/{id}` | Get session metadata |
| `GET` | `/api/v1/sessions/` | List all sessions |
| `DELETE` | `/api/v1/sessions/{id}` | Delete session + all data |
| `POST` | `/api/v1/sessions/{id}/profile` | Create/update user profile |
| `GET` | `/api/v1/sessions/{id}/profile` | Get user profile |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/chat/message` | Send a message, get AI response |
| `GET` | `/api/v1/chat/history/{session_id}` | Get full conversation history |
| `DELETE` | `/api/v1/chat/history/{session_id}` | Clear conversation history |

### Career Resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/career/resume-review` | AI resume review with score |
| `POST` | `/api/v1/career/interview-prep` | Interview questions + tips |
| `GET` | `/api/v1/career/career-paths/{session_id}` | Personalised career paths |
| `GET` | `/api/v1/career/tips/{topic}` | Quick tips on any career topic |

---

## Typical Usage Flow

```
1. POST /api/v1/sessions/          → get session_id
2. POST /api/v1/sessions/{id}/profile → save user background
3. POST /api/v1/chat/message       → start chatting
4. POST /api/v1/career/resume-review → get resume feedback
5. GET  /api/v1/career/career-paths/{id} → get career recommendations
```

---

## Example Request

```bash

curl -X POST http://localhost:8000/api/v1/sessions/ \
  -H "Content-Type: application/json" \
  -d '{"user_name": "Alice", "career_stage": "mid"}'


curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "<id>", "message": "I want to transition from marketing to product management"}'
```
