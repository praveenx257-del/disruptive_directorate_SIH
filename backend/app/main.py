import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.data_service import (
    get_scored_results,
    get_mp_summary,
)

from app.schemas.live_evaluation import LiveEvaluationRequest

from app.ml.live_evaluator import (
    evaluate_live_proposal,
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="JanAudit API",
    description=(
        "MPLADS AI Watchdog API for risk monitoring, "
        "watchlists, district risk analysis, MP scorecards, "
        "and live proposal evaluation."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HELPERS
# ============================================================

def safe_string(value):
    """Convert pandas values safely to JSON-friendly strings."""
    if pd.isna(value):
        return None
    return str(value)


def safe_float(value):
    """Convert pandas numeric values safely."""
    if pd.isna(value):
        return None
    return float(value)


def safe_int(value):
    """Convert pandas integer values safely."""
    if pd.isna(value):
        return None
    return int(value)


def safe_bool(value):
    """Convert pandas boolean-like values safely."""
    if pd.isna(value):
        return False

    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        return value.strip().lower() in {
            "true",
            "1",
            "yes",
            "y",
        }

    return bool(value)


# ============================================================
# BASIC ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "message": "JanAudit API is running"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "JanAudit API"
    }


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

@app.get("/api/summary")
def summary():

    df = get_scored_results()

    total_works = len(df)

    anomalous_works = int(
        (df["anomaly_label"] == -1).sum()
    )

    high_risk_works = int(
        (df["composite_risk_score"] >= 50).sum()
    )

    medium_risk_works = int(
        (
            (df["composite_risk_score"] >= 20)
            & (df["composite_risk_score"] < 50)
        ).sum()
    )

    low_risk_works = int(
        (df["composite_risk_score"] < 20).sum()
    )

    ghost_asset_flags = int(
        df["flag_ghost_asset"].sum()
    )

    near_threshold_flags = int(
        df["flag_near_5L_split"].sum()
    )

    batch_split_flags = int(
        df["flag_batch_split"].sum()
    )

    vague_description_flags = int(
        df["flag_vague_desc"].sum()
    )

    negative_timeline_flags = int(
        df["flag_negative_timeline"].sum()
    )

    return {
        "total_works": total_works,

        "anomalous_works": anomalous_works,

        "risk_distribution": {
            "high": high_risk_works,
            "medium": medium_risk_works,
            "low": low_risk_works,
        },

        "alerts": {
            "ghost_asset": ghost_asset_flags,
            "near_5l_threshold": near_threshold_flags,
            "batch_split": batch_split_flags,
            "vague_description": vague_description_flags,
            "negative_timeline": negative_timeline_flags,
        },

        "average_composite_risk": round(
            float(df["composite_risk_score"].mean()),
            2
        ),

        "max_composite_risk": round(
            float(df["composite_risk_score"].max()),
            2
        ),
    }


# ============================================================
# WATCHLIST
# ============================================================

@app.get("/api/watchlist")
def watchlist(
    limit: int = 20,
    min_risk: float = 0,
    state: str | None = None,
    anomaly_only: bool = False,
):

    df = get_scored_results().copy()

    # --------------------------------------------------------
    # Validate limit
    # --------------------------------------------------------

    limit = max(1, min(limit, 100))

    # --------------------------------------------------------
    # Filter minimum risk
    # --------------------------------------------------------

    df = df[
        df["composite_risk_score"] >= min_risk
    ]

    # --------------------------------------------------------
    # Filter state
    # --------------------------------------------------------

    if state:
        df = df[
            df["State"]
            .astype(str)
            .str.lower()
            == state.strip().lower()
        ]

    # --------------------------------------------------------
    # Filter anomalies
    # --------------------------------------------------------

    if anomaly_only:
        df = df[
            df["anomaly_label"] == -1
        ]

    # --------------------------------------------------------
    # Highest risk first
    # --------------------------------------------------------

    df = df.sort_values(
        by="composite_risk_score",
        ascending=False
    )

    total_matches = len(df)

    df = df.head(limit)

    # --------------------------------------------------------
    # Build response
    # --------------------------------------------------------

    works = []

    for _, row in df.iterrows():

        duplicate_id = (
            None
            if pd.isna(row["duplicate_of_work_id"])
            else int(row["duplicate_of_work_id"])
        )

        similarity_score = (
            None
            if pd.isna(row["semantic_similarity_score"])
            else float(row["semantic_similarity_score"])
        )

        execution_days = (
            None
            if pd.isna(row["execution_days"])
            else float(row["execution_days"])
        )

        cost_escalation_ratio = (
            None
            if pd.isna(row["cost_escalation_ratio"])
            else float(row["cost_escalation_ratio"])
        )

        works.append({

            # ==================================================
            # BASIC WORK INFORMATION
            # ==================================================

            "work_id": int(row["Work ID"]),

            "work_description": safe_string(
                row["Work Description"]
            ),

            "category": safe_string(
                row["Category"]
            ),

            "mp_name": safe_string(
                row["MP Name"]
            ),

            "constituency": safe_string(
                row["Constituency"]
            ),

            "state": safe_string(
                row["State"]
            ),

            "house": safe_string(
                row["House"]
            ),

            # ==================================================
            # LOCATION / IMPLEMENTING AUTHORITY
            # ==================================================

            "ida": safe_string(
                row["IDA"]
            ),

            "primary_vendor": safe_string(
                row["primary_vendor"]
            ),

            # ==================================================
            # FINANCIAL INFORMATION
            # ==================================================

            "recommended_amount": safe_float(
                row["Recommended Amount (₹)"]
            ),

            "final_amount": safe_float(
                row["Final Amount (₹)"]
            ),

            "effective_spent_amt": safe_float(
                row["effective_spent_amt"]
            ),

            "per_work_disbursed": safe_float(
                row["per_work_disbursed"]
            ),

            "group_total_recommended": safe_float(
                row["group_total_recommended"]
            ),

            "group_total_disbursed": safe_float(
                row["group_total_disbursed"]
            ),

            "group_tx_count": safe_int(
                row["group_tx_count"]
            ),

            "cost_escalation_ratio": cost_escalation_ratio,

            # ==================================================
            # RISK
            # ==================================================

            "composite_risk_score": safe_float(
                row["composite_risk_score"]
            ),

            "financial_risk_score": safe_float(
                row["financial_risk_score"]
            ),

            "anomaly_label": safe_int(
                row["anomaly_label"]
            ),

            # ==================================================
            # ALERT REASONS
            # ==================================================

            "alert_reasons": safe_string(
                row["alert_reasons"]
            ),

            # ==================================================
            # RISK FLAGS
            # ==================================================

            "flags": {

                "negative_timeline": safe_int(
                    row["flag_negative_timeline"]
                ),

                "near_5l_split": safe_int(
                    row["flag_near_5L_split"]
                ),

                "batch_split": safe_int(
                    row["flag_batch_split"]
                ),

                "ghost_asset": safe_int(
                    row["flag_ghost_asset"]
                ),

                "vague_description": safe_int(
                    row["flag_vague_desc"]
                ),
            },

            # ==================================================
            # SEMANTIC DUPLICATE
            # ==================================================

            "semantic_duplicate": {

                "duplicate_of_work_id": duplicate_id,

                "similarity_score": similarity_score,
            },

            # ==================================================
            # EXECUTION
            # ==================================================

            "execution_days": execution_days,

            "has_images": safe_bool(
                row["Has Images"]
            ),

            "has_images_completed": (
                None
                if pd.isna(row["Has Images_comp"])
                else safe_bool(row["Has Images_comp"])
            ),

            # ==================================================
            # DATES
            # ==================================================

            "recommendation_date": safe_string(
                row["Recommendation Date"]
            ),

            "completed_date": safe_string(
                row["Completed Date"]
            ),

            # ==================================================
            # GROUP / DUPLICATE INFORMATION
            # ==================================================

            "identical_work_count": safe_float(
                row["identical_work_count"]
            ),

            "duplicate_of_work_id": duplicate_id,

            "semantic_similarity_score": similarity_score,

            # ==================================================
            # ML / STATISTICAL FEATURES
            # ==================================================

            "category_cost_zscore": safe_float(
                row["category_cost_zscore"]
            ),

            "signed_log_zscore": safe_float(
                row["signed_log_zscore"]
            ),

            "log_cost_escalation": safe_float(
                row["log_cost_escalation"]
            ),

            "log_batch_count": safe_float(
                row["log_batch_count"]
            ),

        })

    return {
        "total_matches": total_matches,

        "returned": len(works),

        "filters": {
            "limit": limit,
            "min_risk": min_risk,
            "state": state,
            "anomaly_only": anomaly_only,
        },

        "works": works,
    }


# ============================================================
# DISTRICT RISK
# ============================================================

@app.get("/api/district_risk")
def district_risk(
    state: str | None = None,
    limit: int = 50,
):

    df = get_scored_results().copy()

    # --------------------------------------------------------
    # Validate limit
    # --------------------------------------------------------

    limit = max(1, min(limit, 200))

    # --------------------------------------------------------
    # Optional state filter
    # --------------------------------------------------------

    if state:
        df = df[
            df["State"]
            .astype(str)
            .str.lower()
            == state.strip().lower()
        ]

    # --------------------------------------------------------
    # Group by IDA + State
    # --------------------------------------------------------

    grouped = (
        df.groupby(
            ["IDA", "State"],
            dropna=False
        )
        .agg(

            total_works=(
                "Work ID",
                "count"
            ),

            anomalous_works=(
                "anomaly_label",
                lambda x: int((x == -1).sum())
            ),

            high_risk_works=(
                "composite_risk_score",
                lambda x: int((x >= 50).sum())
            ),

            medium_risk_works=(
                "composite_risk_score",
                lambda x: int(
                    ((x >= 20) & (x < 50)).sum()
                )
            ),

            average_risk=(
                "composite_risk_score",
                "mean"
            ),

            maximum_risk=(
                "composite_risk_score",
                "max"
            ),

            total_recommended_amount=(
                "Recommended Amount (₹)",
                "sum"
            ),

            total_expenditure=(
                "effective_spent_amt",
                "sum"
            ),

            ghost_asset_flags=(
                "flag_ghost_asset",
                "sum"
            ),

            batch_split_flags=(
                "flag_batch_split",
                "sum"
            ),

            near_5l_flags=(
                "flag_near_5L_split",
                "sum"
            ),

            negative_timeline_flags=(
                "flag_negative_timeline",
                "sum"
            ),

            vague_description_flags=(
                "flag_vague_desc",
                "sum"
            ),

            constituency_count=(
                "Constituency",
                "nunique"
            ),
        )
        .reset_index()
    )

    # --------------------------------------------------------
    # Sort
    # --------------------------------------------------------

    grouped = grouped.sort_values(
        by=[
            "average_risk",
            "anomalous_works"
        ],
        ascending=[
            False,
            False
        ]
    )

    total_matches = len(grouped)

    grouped = grouped.head(limit)

    # --------------------------------------------------------
    # Build response
    # --------------------------------------------------------

    districts = []

    for _, row in grouped.iterrows():

        districts.append({

            "district": (
                None
                if pd.isna(row["IDA"])
                else str(row["IDA"])
            ),

            "state": (
                None
                if pd.isna(row["State"])
                else str(row["State"])
            ),

            "total_works": int(
                row["total_works"]
            ),

            "anomalous_works": int(
                row["anomalous_works"]
            ),

            "high_risk_works": int(
                row["high_risk_works"]
            ),

            "medium_risk_works": int(
                row["medium_risk_works"]
            ),

            "average_risk": round(
                float(row["average_risk"]),
                2
            ),

            "maximum_risk": round(
                float(row["maximum_risk"]),
                2
            ),

            "total_recommended_amount": round(
                float(row["total_recommended_amount"]),
                2
            ),

            "total_expenditure": round(
                float(row["total_expenditure"]),
                2
            ),

            "constituency_count": int(
                row["constituency_count"]
            ),

            "alerts": {

                "ghost_asset": int(
                    row["ghost_asset_flags"]
                ),

                "batch_split": int(
                    row["batch_split_flags"]
                ),

                "near_5l_threshold": int(
                    row["near_5l_flags"]
                ),

                "negative_timeline": int(
                    row["negative_timeline_flags"]
                ),

                "vague_description": int(
                    row["vague_description_flags"]
                ),
            },
        })

    return {

        "total_districts": total_matches,

        "returned": len(districts),

        "filters": {
            "state": state,
            "limit": limit,
        },

        "districts": districts,
    }


# ============================================================
# MP SCORECARDS
# ============================================================

@app.get("/api/mp_scorecards")
def mp_scorecards(
    limit: int = 20,
    state: str | None = None,
    house: str | None = None,
    search: str | None = None,
):

    df = get_mp_summary().copy()

    # --------------------------------------------------------
    # Validate limit
    # --------------------------------------------------------

    limit = max(1, min(limit, 200))

    # --------------------------------------------------------
    # Filter state
    # --------------------------------------------------------

    if state:
        df = df[
            df["State"]
            .astype(str)
            .str.lower()
            == state.strip().lower()
        ]

    # --------------------------------------------------------
    # Filter house
    # --------------------------------------------------------

    if house:
        df = df[
            df["House"]
            .astype(str)
            .str.lower()
            == house.strip().lower()
        ]

    # --------------------------------------------------------
    # Search MP / constituency
    # --------------------------------------------------------

    if search:

        search_term = search.strip().lower()

        mp_match = (
            df["MP Name"]
            .astype(str)
            .str.lower()
            .str.contains(
                search_term,
                na=False
            )
        )

        constituency_match = (
            df["Constituency"]
            .astype(str)
            .str.lower()
            .str.contains(
                search_term,
                na=False
            )
        )

        df = df[
            mp_match | constituency_match
        ]

    total_matches = len(df)

    # --------------------------------------------------------
    # Sort by utilization
    # --------------------------------------------------------

    df = df.sort_values(
        by="Utilization %",
        ascending=False,
        na_position="last"
    )

    df = df.head(limit)

    # --------------------------------------------------------
    # Build response
    # --------------------------------------------------------

    scorecards = []

    for _, row in df.iterrows():

        scorecards.append({

            "mp_name": safe_string(
                row["MP Name"]
            ),

            "constituency": safe_string(
                row["Constituency"]
            ),

            "state": safe_string(
                row["State"]
            ),

            "house": safe_string(
                row["House"]
            ),

            "allocated_amount": safe_float(
                row["Allocated Amount (₹)"]
            ),

            "amount_recommended": safe_float(
                row["Amount Recommended (₹)"]
            ),

            "total_expenditure": safe_float(
                row["Total Expenditure (₹)"]
            ),

            "utilization_percent": safe_float(
                row["Utilization %"]
            ),

            "completed_works": safe_int(
                row["Completed Works"]
            ),

            "recommended_works": safe_int(
                row["Recommended Works"]
            ),

            "completion_rate_percent": safe_float(
                row["Completion Rate %"]
            ),

            "balance_not_paid_to_vendors": safe_float(
                row["Balance Not Yet Paid to Vendors (₹)"]
            ),

            "transaction_count": safe_int(
                row["Transaction Count"]
            ),

            "successful_payments": safe_int(
                row["Successful Payments"]
            ),

            "pending_payments": safe_int(
                row["Pending Payments"]
            ),

            "average_rating": safe_float(
                row["Average Rating"]
            ),
        })

    return {

        "total_matches": total_matches,

        "returned": len(scorecards),

        "filters": {
            "limit": limit,
            "state": state,
            "house": house,
            "search": search,
        },

        "scorecards": scorecards,
    }


# ============================================================
# LIVE PROPOSAL EVALUATION
# ============================================================

@app.post("/api/evaluate_live")
def evaluate_live(
    request: LiveEvaluationRequest
):

    result = evaluate_live_proposal(

        state=request.state,

        ida=request.ida,

        category=request.category,

        work_description=request.work_description,

        recommended_amt=request.recommended_amt,

        disbursed_amt=request.disbursed_amt,

        payment_tx_count=request.payment_tx_count,

        vendor_name=request.vendor_name,

        has_images=request.has_images,

        execution_days=request.execution_days,

        is_completed=request.is_completed,
    )

    return {

        "status": "evaluated",

        "proposal": request.model_dump(),

        **result,
    }