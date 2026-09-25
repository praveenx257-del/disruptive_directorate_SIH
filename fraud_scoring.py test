"""
Composite risk-scoring pipeline.

Combines three independent signal sources into a single, explainable 0-100
risk score per work, then materializes the results back onto the Work rows
and generates Alert records for anything above threshold:

  40%  Isolation Forest multivariate anomaly score      (app.ml.anomaly_detection)
  25%  Rule-based red flags (overrun / overdue / IQR)     (app.ml.anomaly_detection)
  20%  Duplicate / near-duplicate work detection           (app.ml.duplicate_detection)
  15%  Vendor concentration ("shell vendor") analysis       (this module)

The weights are intentionally simple and documented so a program officer can
audit *why* a work was flagged, rather than trusting an opaque score.
"""
from __future__ import annotations

import json
from collections import Counter

import pandas as pd
from sqlalchemy.orm import Session

from app.models import Work, Expenditure, Alert
from app.ml.anomaly_detection import detect_anomalies
from app.ml.duplicate_detection import find_duplicate_works

VENDOR_CONCENTRATION_THRESHOLD = 6   # a vendor appearing in >= N unrelated works is suspicious
PRE_SANCTION_PAYMENT_FLAG = "Payment recorded before the work's official sanction date"


def _load_frames(db: Session) -> tuple[pd.DataFrame, pd.DataFrame]:
    works = db.query(Work).all()
    works_df = pd.DataFrame([{
        "work_id": w.id,
        "work_code": w.work_code,
        "category": w.category,
        "description": w.description,
        "district": w.district,
        "state": w.state,
        "status": w.status,
        "estimated_cost": w.estimated_cost,
        "sanctioned_amount": w.sanctioned_amount,
        "sanction_date": w.sanction_date,
        "expected_completion": w.expected_completion,
        "physical_progress_pct": w.physical_progress_pct,
    } for w in works])

    expenditures = db.query(Expenditure).all()
    exp_df = pd.DataFrame([{
        "work_id": e.work_id,
        "amount": e.amount,
        "transaction_date": e.transaction_date,
        "vendor_name": e.vendor_name,
    } for e in expenditures])

    return works_df, exp_df


def _vendor_concentration_flags(exp_df: pd.DataFrame) -> dict[int, str]:
    """Maps work_id -> reason string for works paying a vendor that recurs suspiciously often."""
    vendor_work_counts = exp_df.groupby("vendor_name")["work_id"].nunique()
    suspicious_vendors = set(vendor_work_counts[vendor_work_counts >= VENDOR_CONCENTRATION_THRESHOLD].index)

    flags: dict[int, str] = {}
    if not suspicious_vendors:
        return flags

    for _, row in exp_df[exp_df["vendor_name"].isin(suspicious_vendors)].iterrows():
        n = vendor_work_counts[row["vendor_name"]]
        flags[row["work_id"]] = f"Vendor '{row['vendor_name']}' appears across {n} unrelated works (possible shell vendor / collusion)"
    return flags


def _pre_sanction_flags(db: Session, exp_df: pd.DataFrame, works_df: pd.DataFrame) -> dict[int, str]:
    sanction_dates = dict(zip(works_df["work_id"], pd.to_datetime(works_df["sanction_date"])))
    flags: dict[int, str] = {}
    for _, row in exp_df.iterrows():
        wid = row["work_id"]
        if wid in sanction_dates and pd.Timestamp(row["transaction_date"]) < sanction_dates[wid]:
            flags[wid] = PRE_SANCTION_PAYMENT_FLAG
    return flags


def _risk_level(score: float) -> str:
    if score >= 75:
        return "Critical"
    if score >= 50:
        return "High"
    if score >= 25:
        return "Medium"
    return "Low"


def run_full_pipeline(db: Session) -> dict:
    """
    Runs the whole detection pipeline against the current database contents,
    writes risk_score / risk_level / anomaly_flags back onto each Work row,
    replaces existing Alert rows with freshly generated ones, and returns a
    summary dict for logging / API response.
    """
    works_df, exp_df = _load_frames(db)
    if works_df.empty:
        return {"works_scored": 0, "alerts_created": 0}

    anomalies_df = detect_anomalies(works_df, exp_df)
    duplicates = find_duplicate_works(works_df)
    vendor_flags = _vendor_concentration_flags(exp_df)
    pre_sanction_flags = _pre_sanction_flags(db, exp_df, works_df)

    db.query(Alert).delete()

    alerts_created = 0
    work_rows = {w.id: w for w in db.query(Work).all()}

    for _, row in anomalies_df.iterrows():
        wid = int(row["work_id"])
        reasons: list[str] = list(row["anomaly_reasons"])

        dup_hits = duplicates.get(wid, [])
        if dup_hits:
            best = max(dup_hits, key=lambda d: d["similarity"])
            reasons.append(
                f"Near-duplicate of work {best['work_code']} "
                f"({best['similarity']*100:.0f}% text similarity) in the same district"
            )

        if wid in vendor_flags:
            reasons.append(vendor_flags[wid])

        if wid in pre_sanction_flags:
            reasons.append(pre_sanction_flags[wid])

        # --- composite score --------------------------------------------------
        if_component = row["if_score"] * 100          # 0-100
        rule_component = min(100, len([
            r for r in reasons
            if "estimated cost" in r or "overdue" in r or "statistical outlier" in r
        ]) * 33)
        duplicate_component = 100 if dup_hits else 0
        vendor_component = 100 if (wid in vendor_flags or wid in pre_sanction_flags) else 0

        composite = (
            0.40 * if_component
            + 0.25 * rule_component
            + 0.20 * duplicate_component
            + 0.15 * vendor_component
        )
        composite = round(min(100.0, composite), 1)
        level = _risk_level(composite)

        work = work_rows.get(wid)
        if work is None:
            continue
        work.risk_score = composite
        work.risk_level = level
        work.anomaly_flags = json.dumps(reasons)

        if reasons:
            severity = level if level in ("High", "Critical") else ("Medium" if level == "Medium" else "Low")
            for reason in reasons:
                category = _classify_reason(reason)
                db.add(Alert(
                    work_id=wid,
                    category=category,
                    severity=severity,
                    message=reason,
                ))
                alerts_created += 1

    db.commit()
    return {"works_scored": len(anomalies_df), "alerts_created": alerts_created}


def _classify_reason(reason: str) -> str:
    r = reason.lower()
    if "estimated cost" in r or "outlier" in r:
        return "Cost Anomaly"
    if "fund utilization" in r:
        return "Fund Utilization Mismatch"
    if "overdue" in r:
        return "Project Delay"
    if "duplicate" in r:
        return "Duplicate Work"
    if "vendor" in r:
        return "Vendor Concentration"
    if "sanction date" in r:
        return "Payment Irregularity"
    if "multivariate" in r:
        return "Statistical Anomaly"
    return "General"
