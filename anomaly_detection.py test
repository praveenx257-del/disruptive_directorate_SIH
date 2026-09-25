"""
Statistical / ML anomaly detection over engineered work-level features.

Two complementary techniques are used deliberately:
  1. Isolation Forest   - unsupervised, catches multivariate outliers that no
                           single hand-written rule would flag (e.g. an
                           unusual *combination* of high cost, slow progress
                           and delayed payments).
  2. Category-wise IQR  - catches simple, explainable univariate outliers
                           (e.g. "this road costs 4x the median road in this
                           category") which are easy to justify to an auditor
                           even though they are cruder than the forest.

The module returns a per-work anomaly score in [0, 1] plus a list of
human-readable reasons, so results can feed both the ML risk model and the
dashboards without a black box in between.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


@dataclass
class WorkAnomalyResult:
    work_id: int
    isolation_forest_score: float   # 0 (normal) .. 1 (highly anomalous)
    iqr_outlier: bool
    reasons: list[str] = field(default_factory=list)


def _build_feature_frame(works_df: pd.DataFrame, expenditure_df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineers a numeric feature matrix, one row per work, from raw work and
    expenditure tables.
    """
    exp_agg = (
        expenditure_df.groupby("work_id")["amount"]
        .agg(total_spent="sum", n_payments="count", max_payment="max")
        .reset_index()
    )

    df = works_df.merge(exp_agg, on="work_id", how="left")
    df["total_spent"] = df["total_spent"].fillna(0)
    df["n_payments"] = df["n_payments"].fillna(0)
    df["max_payment"] = df["max_payment"].fillna(0)

    df["cost_overrun_ratio"] = np.where(
        df["estimated_cost"] > 0, df["sanctioned_amount"] / df["estimated_cost"], 1.0
    )
    df["utilization_ratio"] = np.where(
        df["sanctioned_amount"] > 0, df["total_spent"] / df["sanctioned_amount"], 0.0
    )
    # fund-utilization vs physical work mismatch: high spend, low delivered progress
    df["progress_fund_gap"] = df["utilization_ratio"] * 100 - df["physical_progress_pct"]
    df["days_since_sanction"] = (pd.Timestamp.today() - pd.to_datetime(df["sanction_date"])).dt.days
    df["days_overdue"] = (
        pd.Timestamp.today() - pd.to_datetime(df["expected_completion"])
    ).dt.days.clip(lower=0)
    df["days_overdue"] = np.where(df["status"] == "Completed", 0, df["days_overdue"])

    return df


def run_isolation_forest(df: pd.DataFrame, contamination: float = 0.08) -> pd.Series:
    """
    Fits an Isolation Forest on the engineered numeric features and returns a
    normalized anomaly score per row (higher = more anomalous).
    """
    feature_cols = [
        "cost_overrun_ratio",
        "utilization_ratio",
        "progress_fund_gap",
        "days_overdue",
        "n_payments",
        "max_payment",
    ]
    X = df[feature_cols].fillna(0).values
    X = StandardScaler().fit_transform(X)

    model = IsolationForest(
        n_estimators=300,
        contamination=contamination,
        random_state=42,
    )
    model.fit(X)

    # decision_function: higher = more normal. Flip and min-max scale to [0, 1].
    raw = -model.decision_function(X)
    scaled = (raw - raw.min()) / (raw.max() - raw.min() + 1e-9)
    return pd.Series(scaled, index=df.index)


def flag_category_iqr_outliers(df: pd.DataFrame, column: str = "sanctioned_amount") -> pd.Series:
    """Per-category IQR fence: True where a work's value is a statistical outlier vs its peers."""
    def _flag(group: pd.Series) -> pd.Series:
        q1, q3 = group.quantile(0.25), group.quantile(0.75)
        iqr = q3 - q1
        upper = q3 + 1.5 * iqr
        lower = q1 - 1.5 * iqr
        return (group > upper) | (group < lower)

    return df.groupby("category")[column].transform(_flag)


def detect_anomalies(works_df: pd.DataFrame, expenditure_df: pd.DataFrame) -> pd.DataFrame:
    """
    Main entry point: returns works_df augmented with anomaly scores/reasons.
    Expects works_df to already have a `work_id` column (== Work.id).
    """
    df = _build_feature_frame(works_df, expenditure_df)
    df["if_score"] = run_isolation_forest(df)
    df["iqr_outlier"] = flag_category_iqr_outliers(df, "sanctioned_amount")

    reasons_col = []
    for _, row in df.iterrows():
        reasons = []
        if row["cost_overrun_ratio"] >= 1.3:
            reasons.append(f"Sanctioned amount is {row['cost_overrun_ratio']:.2f}x the estimated cost")
        if row["progress_fund_gap"] >= 30:
            reasons.append(
                f"Fund utilization ({row['utilization_ratio']*100:.0f}%) far exceeds physical progress "
                f"({row['physical_progress_pct']:.0f}%)"
            )
        if row["days_overdue"] >= 180:
            reasons.append(f"Work is overdue by {int(row['days_overdue'])} days past expected completion")
        if row["iqr_outlier"]:
            reasons.append("Sanctioned amount is a statistical outlier for its work category")
        if row["if_score"] >= 0.7:
            reasons.append("Flagged as a multivariate statistical outlier by the anomaly-detection model")
        reasons_col.append(reasons)

    df["anomaly_reasons"] = reasons_col
    return df
