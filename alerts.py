from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Alert, Work
from app.schemas import AlertOut

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(
    db: Session = Depends(get_db),
    severity: Optional[str] = None,
    category: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    limit: int = 200,
):
    q = db.query(Alert)
    if severity:
        q = q.filter(Alert.severity == severity)
    if category:
        q = q.filter(Alert.category == category)
    if is_resolved is not None:
        q = q.filter(Alert.is_resolved == is_resolved)
    q = q.order_by(Alert.severity.desc(), Alert.created_at.desc()).limit(limit)
    return q.all()


@router.post("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    db.commit()
    db.refresh(alert)
    return alert
