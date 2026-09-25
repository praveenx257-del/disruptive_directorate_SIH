from collections import Counter, defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Work, Expenditure, MemberOfParliament, Alert
from app.schemas import DashboardSummary, WorkListItem

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)):
    total_works = db.query(func.count(Work.id)).scalar() or 0
    total_sanctioned = db.query(func.sum(Work.sanctioned_amount)).scalar() or 0.0
    total_expenditure = db.query(func.sum(Expenditure.amount)).scalar() or 0.0
    total_mps = db.query(func.count(MemberOfParliament.id)).scalar() or 0
    alerts_open = db.query(func.count(Alert.id)).filter(Alert.is_resolved == False).scalar() or 0  # noqa: E712

    utilization_pct = round((total_expenditure / total_sanctioned) * 100, 1) if total_sanctioned else 0.0

    risk_rows = db.query(Work.risk_level, func.count(Work.id)).group_by(Work.risk_level).all()
    risk_distribution = {level: count for level, count in risk_rows}
    for level in ["Low", "Medium", "High", "Critical"]:
        risk_distribution.setdefault(level, 0)

    category_rows = (
        db.query(Work.category, func.sum(Work.sanctioned_amount))
        .group_by(Work.category)
        .order_by(func.sum(Work.sanctioned_amount).desc())
        .all()
    )
    category_spend = [{"category": c, "amount": round(a or 0, 2)} for c, a in category_rows]

    state_rows = (
        db.query(Work.state, func.avg(Work.risk_score), func.count(Work.id))
        .group_by(Work.state)
        .order_by(func.avg(Work.risk_score).desc())
        .all()
    )
    state_risk = [
        {"state": s, "avg_risk_score": round(r or 0, 1), "works": n} for s, r, n in state_rows
    ]

    # monthly expenditure trend (last 12 buckets by transaction month)
    monthly = defaultdict(float)
    for txn_date, amount in db.query(Expenditure.transaction_date, Expenditure.amount).all():
        key = txn_date.strftime("%Y-%m")
        monthly[key] += amount
    monthly_trend = [{"month": k, "amount": round(v, 2)} for k, v in sorted(monthly.items())][-12:]

    top_risky = (
        db.query(Work)
        .join(MemberOfParliament)
        .order_by(Work.risk_score.desc())
        .limit(10)
        .all()
    )
    top_risky_items = [
        WorkListItem(
            id=w.id, work_code=w.work_code, category=w.category, description=w.description,
            district=w.district, state=w.state, status=w.status,
            sanctioned_amount=w.sanctioned_amount, estimated_cost=w.estimated_cost,
            physical_progress_pct=w.physical_progress_pct, risk_score=w.risk_score,
            risk_level=w.risk_level, mp_name=w.mp.name,
        ) for w in top_risky
    ]

    return DashboardSummary(
        total_works=total_works,
        total_sanctioned=round(total_sanctioned, 2),
        total_expenditure=round(total_expenditure, 2),
        utilization_pct=utilization_pct,
        total_mps=total_mps,
        alerts_open=alerts_open,
        risk_distribution=risk_distribution,
        category_spend=category_spend,
        state_risk=state_risk,
        monthly_expenditure_trend=monthly_trend,
        top_risky_works=top_risky_items,
    )
