import logging
import threading
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from database import create_tables, SessionLocal
from messaging.consumer import start_consumer, retrigger_unrated_workers
from routers import rating, matching, claim, geolocation, interview, chat

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    start_consumer()
    threading.Thread(target=retrigger_unrated_workers, args=(SessionLocal,), daemon=True).start()
    print("[SSFRS AI Service] Started on port 8083")
    yield


app = FastAPI(
    title="SSFRS AI Engine Service",
    description="Service 3 — Worker rating, AI matching, claim mediation, geolocation verification",
    version="1.0.0",
    lifespan=lifespan,
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    logger.error(
        "[422] Validation error on %s\nErrors: %s\nBody (first 500 chars): %s",
        request.url.path,
        exc.errors(),
        body[:500].decode("utf-8", errors="replace"),
    )
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8082"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rating.router)
app.include_router(matching.router)
app.include_router(claim.router)
app.include_router(geolocation.router)
app.include_router(interview.router)
app.include_router(chat.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SSFRS AI Engine", "port": 8083}
