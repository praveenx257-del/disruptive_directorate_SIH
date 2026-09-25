"""
Core data model for the MPLADS AI monitoring platform.

MemberOfParliament  -> 1..N Work
Work                -> 1..N Expenditure
Work                -> 1..N ProgressUpdate
Work                -> 1..N Alert  (system-generated risk findings)
"""
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship

from app.database import Base


class MemberOfParliament(Base):
    __tablename__ = "members_of_parliament"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    house = Column(String, nullable=False)          # "Lok Sabha" | "Rajya Sabha"
    state = Column(String, nullable=False, index=True)
    constituency = Column(String, nullable=False)
    party = Column(String, nullable=False)
    term_start = Column(Date, nullable=False)

    works = relationship("Work", back_populates="mp", cascade="all, delete-orphan")


class Work(Base):
    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True)
    work_code = Column(String, unique=True, index=True, nullable=False)
    mp_id = Column(Integer, ForeignKey("members_of_parliament.id"), nullable=False)

    category = Column(String, nullable=False, index=True)   # Drinking Water, Roads, ...
    description = Column(Text, nullable=False)
    district = Column(String, nullable=False, index=True)
    state = Column(String, nullable=False, index=True)
    implementing_agency = Column(String, nullable=False)

    estimated_cost = Column(Float, nullable=False)        # DPR / admin-approved estimate
    sanctioned_amount = Column(Float, nullable=False)      # amount recommended/released
    sanction_date = Column(Date, nullable=False)
    expected_completion = Column(Date, nullable=False)
    actual_completion = Column(Date, nullable=True)

    status = Column(String, nullable=False, default="In Progress")  # Sanctioned/In Progress/Completed/Stalled
    physical_progress_pct = Column(Float, nullable=False, default=0.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # fields populated by the ML pipeline
    risk_score = Column(Float, nullable=False, default=0.0)     # 0-100
    risk_level = Column(String, nullable=False, default="Low")  # Low/Medium/High/Critical
    anomaly_flags = Column(Text, nullable=True)                 # JSON-encoded list of reasons

    mp = relationship("MemberOfParliament", back_populates="works")
    expenditures = relationship("Expenditure", back_populates="work", cascade="all, delete-orphan")
    progress_updates = relationship("ProgressUpdate", back_populates="work", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="work", cascade="all, delete-orphan")


class Expenditure(Base):
    __tablename__ = "expenditures"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    transaction_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    payment_stage = Column(String, nullable=False)   # Advance/Installment/Final
    vendor_name = Column(String, nullable=False, index=True)
    vendor_account = Column(String, nullable=False)
    mode = Column(String, nullable=False, default="Bank Transfer")

    work = relationship("Work", back_populates="expenditures")


class ProgressUpdate(Base):
    __tablename__ = "progress_updates"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    update_date = Column(Date, nullable=False)
    physical_progress_pct = Column(Float, nullable=False)
    financial_progress_pct = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True)

    work = relationship("Work", back_populates="progress_updates")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("works.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = Column(String, nullable=False)     # e.g. "Cost Overrun", "Duplicate Work"
    severity = Column(String, nullable=False)      # Low/Medium/High/Critical
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)

    work = relationship("Work", back_populates="alerts")
