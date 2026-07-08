import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime
from database import Base


def _uuid():
    return str(uuid.uuid4())


class WorkerRating(Base):
    __tablename__ = "worker_ratings"

    id = Column(String, primary_key=True, default=_uuid)
    worker_id = Column(String, unique=True, nullable=False, index=True)
    worker_name = Column(String)
    worker_email = Column(String)
    specialization = Column(String)

    cv_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    projects_score = Column(Float, default=0.0)
    ratings_score = Column(Float, default=0.0)
    failure_score = Column(Float, default=10.0)
    overall_score = Column(Float, default=0.0)
    reasoning = Column(Text)

    completed_projects = Column(Integer, default=0)
    past_failures = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MediationReport(Base):
    __tablename__ = "mediation_reports"

    id = Column(String, primary_key=True, default=_uuid)
    claim_id = Column(String, unique=True, nullable=False, index=True)
    project_id = Column(String, nullable=False)
    worker_id = Column(String, nullable=False)
    provider_id = Column(String, nullable=False)

    claim_description = Column(Text)
    worker_response = Column(Text)
    geolocation_summary = Column(Text)

    analysis = Column(Text)
    recommendation = Column(String)   # APPROVE | REJECT | NEEDS_MORE_INFO
    reasoning = Column(Text)
    key_findings = Column(Text)       # JSON array as string
    confidence_score = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)


class ProjectMatchCache(Base):
    __tablename__ = "project_match_cache"

    id = Column(String, primary_key=True, default=_uuid)
    project_id = Column(String, unique=True, nullable=False, index=True)
    result_json = Column(Text, nullable=False)   # JSON list of ranked worker dicts
    created_at = Column(DateTime, default=datetime.utcnow)


class GeolocationResult(Base):
    __tablename__ = "geolocation_results"

    id = Column(String, primary_key=True, default=_uuid)
    claim_id = Column(String, nullable=False, index=True)
    photo_key = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(Text)
    photo_timestamp = Column(String)
    location_status = Column(String)  # VERIFIED | MISMATCH | NO_GPS
    timeline_status = Column(String)  # CONSISTENT | INCONSISTENT | UNKNOWN
    flags = Column(Text)              # JSON array as string

    created_at = Column(DateTime, default=datetime.utcnow)
