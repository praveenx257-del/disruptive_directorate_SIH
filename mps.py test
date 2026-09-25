from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MemberOfParliament, Work, Expenditure
from app.schemas import MPOut, MPProfileOut, WorkListItem

router = APIRouter(prefix="/api/mps", tags=["mps"])


@router.get("", response_model=list[MPOut])
def list_mps(db: Session = Depends(get_db)):
    return db.query(MemberOfParliament).order_by(MemberOfParliament.name).all()


@router.get("/{mp_id}", response_model=MPProfileOut)
def get_mp_profile(mp_id: int, db: Session = Depends(get_db)):
    mp = db.query(MemberOfParliament).filter(MemberOfParliament.id == mp_id).first()
    if not mp:
        raise HTTPException(status_code=404, detail="MP not found")

    works = db.query(Work).filter(Work.mp_id == mp_id).all()
    work_ids = [w.id for w in works]
    total_sanctioned = sum(w.sanctioned_amount for w in works)
    total_expenditure = (
        db.query(func.sum(Expenditure.amount)).filter(Expenditure.work_id.in_(work_ids)).scalar() or 0.0
    ) if work_ids else 0.0
    avg_risk = round(sum(w.risk_score for w in works) / len(works), 1) if works else 0.0
    risk_distribution = dict(Counter(w.risk_level for w in works))
    for level in ["Low", "Medium", "High", "Critical"]:
        risk_distribution.setdefault(level, 0)

    work_items = [
        WorkListItem(
            id=w.id, work_code=w.work_code, category=w.category, description=w.description,
            district=w.district, state=w.state, status=w.status,
            sanctioned_amount=w.sanctioned_amount, estimated_cost=w.estimated_cost,
            physical_progress_pct=w.physical_progress_pct, risk_score=w.risk_score,
            risk_level=w.risk_level, mp_name=mp.name,
        ) for w in sorted(works, key=lambda x: x.risk_score, reverse=True)
    ]

    return MPProfileOut(
        mp=mp,
        total_sanctioned=round(total_sanctioned, 2),
        total_expenditure=round(total_expenditure, 2),
        utilization_pct=round((total_expenditure / total_sanctioned) * 100, 1) if total_sanctioned else 0.0,
        works_count=len(works),
        avg_risk_score=avg_risk,
        risk_distribution=risk_distribution,
        works=work_items,
    )
