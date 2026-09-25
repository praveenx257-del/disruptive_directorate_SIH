import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Work, MemberOfParliament
from app.schemas import WorkListItem, WorkDetail

router = APIRouter(prefix="/api/works", tags=["works"])


@router.get("", response_model=list[WorkListItem])
def list_works(
    db: Session = Depends(get_db),
    risk_level: Optional[str] = None,
    state: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("risk_score", pattern="^(risk_score|sanctioned_amount|physical_progress_pct)$"),
    limit: int = Query(100, le=500),
):
    q = db.query(Work).join(MemberOfParliament)
    if risk_level:
        q = q.filter(Work.risk_level == risk_level)
    if state:
        q = q.filter(Work.state == state)
    if category:
        q = q.filter(Work.category == category)
    if status:
        q = q.filter(Work.status == status)
    if search:
        like = f"%{search}%"
        q = q.filter(Work.description.ilike(like) | Work.work_code.ilike(like))

    q = q.order_by(getattr(Work, sort_by).desc()).limit(limit)
    works = q.all()

    return [
        WorkListItem(
            id=w.id, work_code=w.work_code, category=w.category, description=w.description,
            district=w.district, state=w.state, status=w.status,
            sanctioned_amount=w.sanctioned_amount, estimated_cost=w.estimated_cost,
            physical_progress_pct=w.physical_progress_pct, risk_score=w.risk_score,
            risk_level=w.risk_level, mp_name=w.mp.name,
        ) for w in works
    ]


@router.get("/{work_id}", response_model=WorkDetail)
def get_work(work_id: int, db: Session = Depends(get_db)):
    work = (
        db.query(Work)
        .options(joinedload(Work.mp), joinedload(Work.expenditures), joinedload(Work.progress_updates), joinedload(Work.alerts))
        .filter(Work.id == work_id)
        .first()
    )
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    data = WorkDetail.model_validate(work, from_attributes=True)
    data.anomaly_flags = json.loads(work.anomaly_flags) if work.anomaly_flags else []
    return data


@router.get("/meta/filters")
def get_filter_options(db: Session = Depends(get_db)):
    states = [r[0] for r in db.query(Work.state).distinct().order_by(Work.state).all()]
    categories = [r[0] for r in db.query(Work.category).distinct().order_by(Work.category).all()]
    statuses = [r[0] for r in db.query(Work.status).distinct().all()]
    return {"states": states, "categories": categories, "statuses": statuses}
