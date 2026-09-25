from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel


class ExpenditureOut(BaseModel):
    id: int
    transaction_date: date
    amount: float
    payment_stage: str
    vendor_name: str
    vendor_account: str
    mode: str

    class Config:
        from_attributes = True


class ProgressOut(BaseModel):
    id: int
    update_date: date
    physical_progress_pct: float
    financial_progress_pct: float
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    work_id: int
    created_at: datetime
    category: str
    severity: str
    message: str
    is_resolved: bool

    class Config:
        from_attributes = True


class MPOut(BaseModel):
    id: int
    name: str
    house: str
    state: str
    constituency: str
    party: str

    class Config:
        from_attributes = True


class WorkListItem(BaseModel):
    id: int
    work_code: str
    category: str
    description: str
    district: str
    state: str
    status: str
    sanctioned_amount: float
    estimated_cost: float
    physical_progress_pct: float
    risk_score: float
    risk_level: str
    mp_name: str

    class Config:
        from_attributes = True


class WorkDetail(BaseModel):
    id: int
    work_code: str
    category: str
    description: str
    district: str
    state: str
    implementing_agency: str
    estimated_cost: float
    sanctioned_amount: float
    sanction_date: date
    expected_completion: date
    actual_completion: Optional[date]
    status: str
    physical_progress_pct: float
    latitude: Optional[float]
    longitude: Optional[float]
    risk_score: float
    risk_level: str
    anomaly_flags: List[str]
    mp: MPOut
    expenditures: List[ExpenditureOut]
    progress_updates: List[ProgressOut]
    alerts: List[AlertOut]

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_works: int
    total_sanctioned: float
    total_expenditure: float
    utilization_pct: float
    total_mps: int
    alerts_open: int
    risk_distribution: dict
    category_spend: List[dict]
    state_risk: List[dict]
    monthly_expenditure_trend: List[dict]
    top_risky_works: List[WorkListItem]


class MPProfileOut(BaseModel):
    mp: MPOut
    total_sanctioned: float
    total_expenditure: float
    utilization_pct: float
    works_count: int
    avg_risk_score: float
    risk_distribution: dict
    works: List[WorkListItem]
