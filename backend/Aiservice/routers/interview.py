from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from groq_client import chat_json

router = APIRouter(prefix="/api/ai/interview", tags=["Interview"])


class RefineRequest(BaseModel):
    raw_transcript: str
    question: str


class RefineResponse(BaseModel):
    refined_transcript: str


class InterviewAnswerInput(BaseModel):
    question: str
    transcript: str
    durationSec: Optional[int] = None


class ScoreInterviewRequest(BaseModel):
    answers: List[InterviewAnswerInput]
    specialization: str


class ScoreInterviewResponse(BaseModel):
    score: int
    reasoning: str


@router.post("/refine-transcript", response_model=RefineResponse)
def refine_transcript(request: RefineRequest):
    if not request.raw_transcript.strip():
        return RefineResponse(refined_transcript="")

    prompt = f"""You are a transcript correction assistant for an interview platform.
A worker answered a question verbally. The speech-to-text captured their response but may contain mispronounced words, incomplete words, or unclear phrases due to accent or pronunciation.

INTERVIEW QUESTION: {request.question}

RAW TRANSCRIPT: {request.raw_transcript}

Your task:
1. Fix mispronounced or unclear words based on the context of the question
2. Fill in obviously missing or cut-off words
3. Keep the worker's original meaning and speaking style — do NOT rephrase, improve, or add new ideas
4. Remove only excessive filler words (um, uh) — keep the rest natural

Respond ONLY with valid JSON, no markdown:
{{"refined_transcript": "<corrected transcript here>"}}"""

    try:
        result = chat_json(prompt, temperature=0.2, max_tokens=600)
        refined = result.get("refined_transcript", "").strip()
        return RefineResponse(refined_transcript=refined or request.raw_transcript)
    except Exception:
        return RefineResponse(refined_transcript=request.raw_transcript)


@router.post("/score-answers", response_model=ScoreInterviewResponse)
def score_interview(request: ScoreInterviewRequest):
    if not request.answers:
        return ScoreInterviewResponse(score=0, reasoning="No answers were provided for scoring.")

    answers_text = "\n\n".join([
        f"Question {i + 1}: {a.question}\nAnswer: {a.transcript.strip() or '(No verbal response recorded)'}"
        for i, a in enumerate(request.answers)
    ])

    prompt = f"""You are a senior recruiter evaluating a video job interview for a {request.specialization} position.

INTERVIEW ANSWERS:
{answers_text}

Score the candidate from 0 to 100 based on these weighted criteria:
- Communication clarity and articulation (20%)
- Technical depth and domain knowledge relevant to {request.specialization} (30%)
- Problem-solving ability and critical thinking shown in answers (25%)
- Professionalism, self-awareness, and growth mindset (15%)
- Use of specific, relevant, concrete examples (10%)

Write a reasoning of 2-3 sentences that mentions actual strengths or weaknesses you observed in the specific answers above.

Respond ONLY with valid JSON, no markdown:
{{"score": <integer 0-100>, "reasoning": "<your 2-3 sentence evaluation>"}}"""

    try:
        result = chat_json(prompt, temperature=0.25, max_tokens=350)
        raw_score = result.get("score", 0)
        score = max(0, min(100, int(raw_score)))
        reasoning = result.get("reasoning", "").strip()
        return ScoreInterviewResponse(
            score=score,
            reasoning=reasoning or "Interview evaluated successfully by AI scoring system."
        )
    except Exception:
        return ScoreInterviewResponse(score=0, reasoning="AI scoring temporarily unavailable. Please retry.")
