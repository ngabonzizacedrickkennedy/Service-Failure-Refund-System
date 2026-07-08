import json
import urllib.request
import urllib.error
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import groq_client as _gc
from config import settings

router = APIRouter(prefix="/api/ai/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_role: str  # "WORKER" | "PROVIDER"
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str


# ── internal HTTP helpers ─────────────────────────────────────────────────────

def _get_json(path: str) -> object:
    url = f"{settings.service2_base_url}{path}"
    req = urllib.request.Request(url, headers={"X-Internal-Key": settings.internal_api_key})
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read().decode())


def _fetch_worker_context(worker_id: str) -> str:
    """
    Returns a text block describing this worker's assigned projects and open opportunities.
    """
    try:
        data = _get_json(f"/api/internal/worker-context/{worker_id}")
        assigned = data.get("assignedProjects", [])
        open_projects = data.get("openProjects", [])

        lines = []

        if assigned:
            lines.append("=== YOUR ASSIGNED PROJECTS ===")
            for p in assigned:
                status = p.get("status", "UNKNOWN")
                lines.append(
                    f"- [{status}] {p.get('title', 'Untitled')} "
                    f"| Category: {p.get('category', '?')} "
                    f"| Budget: ${p.get('budget', '?')} "
                    f"| Deadline: {p.get('deadline', '?')} "
                    f"| Location: {p.get('constructionLocation') or 'Not specified'}"
                )
                if p.get("scopeOfWork"):
                    lines.append(f"  Scope: {p['scopeOfWork'][:200]}")
        else:
            lines.append("=== YOUR ASSIGNED PROJECTS ===")
            lines.append("You are not currently assigned to any project.")

        if open_projects:
            lines.append("\n=== OPEN PROJECTS YOU CAN APPLY FOR ===")
            for p in open_projects[:15]:
                lines.append(
                    f"- {p.get('title', 'Untitled')} "
                    f"| Category: {p.get('category', '?')} "
                    f"| Skills needed: {p.get('requiredSkills', '?')} "
                    f"| Budget: ${p.get('budget', '?')} "
                    f"| Deadline: {p.get('deadline', '?')}"
                )
        else:
            lines.append("\n=== OPEN PROJECTS ===")
            lines.append("There are no open projects in the system right now.")

        return "\n".join(lines)
    except Exception as e:
        return f"(Live project data unavailable: {e})"


def _fetch_provider_context(provider_id: str) -> str:
    """
    Returns a text block describing this provider's projects and their workers.
    """
    try:
        data = _get_json(f"/api/internal/provider-context/{provider_id}")
        projects = data.get("myProjects", [])

        if not projects:
            return "=== YOUR PROJECTS ===\nYou have not posted any projects yet."

        lines = ["=== YOUR PROJECTS ==="]
        for p in projects:
            status = p.get("status", "UNKNOWN")
            worker = p.get("assignedWorkerId", "")
            lines.append(
                f"- [{status}] {p.get('title', 'Untitled')} "
                f"| Budget: ${p.get('budget', '?')} "
                f"| Deadline: {p.get('deadline', '?')} "
                f"| Worker assigned: {'Yes (ID: ' + worker[:8] + '…)' if worker else 'No'}"
            )
        return "\n".join(lines)
    except Exception as e:
        return f"(Live project data unavailable: {e})"


# ── system prompt builder ─────────────────────────────────────────────────────

def _build_system_prompt(user_role: str, user_id: Optional[str]) -> str:
    if user_role == "WORKER":
        context = _fetch_worker_context(user_id) if user_id else "(No user ID provided — cannot fetch personal data.)"
        return (
            "You are the SSFRS (Service Failure Refund System) AI Assistant for workers. "
            "You have access to real-time data about this worker's project assignments and available opportunities. "
            "Be helpful, specific, and factual — always reference the live data below when answering questions "
            "about projects, assignments, or status. For questions outside the platform (career advice, "
            "industry knowledge, general topics), answer freely and helpfully.\n\n"
            "LIVE SYSTEM DATA FOR THIS WORKER:\n"
            f"{context}\n\n"
            "When the worker asks 'am I assigned to a project?', 'what is my project status?', or similar — "
            "use the ASSIGNED PROJECTS section above to answer directly and accurately. "
            "If they ask about available opportunities, use the OPEN PROJECTS section."
        )
    else:  # PROVIDER
        context = _fetch_provider_context(user_id) if user_id else "(No user ID provided — cannot fetch personal data.)"
        return (
            "You are the SSFRS (Service Failure Refund System) AI Assistant for project providers. "
            "You have access to real-time data about this provider's posted projects. "
            "Be helpful, specific, and factual — always reference the live data below when answering questions "
            "about projects, workers, or status. For questions outside the platform, answer freely.\n\n"
            "LIVE SYSTEM DATA FOR THIS PROVIDER:\n"
            f"{context}\n\n"
            "When the provider asks about their projects, worker assignments, or project status — "
            "use the data above to answer directly and accurately."
        )


# ── endpoint ──────────────────────────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    system_prompt = _build_system_prompt(request.user_role, request.user_id)

    groq_messages = [{"role": "system", "content": system_prompt}]
    for m in request.messages[-20:]:
        groq_messages.append({"role": m.role, "content": m.content})

    try:
        completion = _gc._client.chat.completions.create(
            model=settings.groq_model,
            messages=groq_messages,
            max_tokens=1024,
            temperature=0.7,
        )
        reply = completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    return ChatResponse(response=reply)
