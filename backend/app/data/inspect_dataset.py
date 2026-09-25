from pathlib import Path

import pandas as pd


# ============================================================
# PATH
# ============================================================

# Current file:
# JanAudit/backend/app/data/inspect_dataset.py
#
# parents[0] -> data
# parents[1] -> app
# parents[2] -> backend
# parents[3] -> JanAudit

PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "mplads_scored_results.csv"
)


# ============================================================
# CHECK DATASET
# ============================================================

print("=" * 70)
print("JanAudit Dataset Inspection")
print("=" * 70)

print("\nDataset path:")
print(DATA_PATH)


if not DATA_PATH.exists():

    print("\nERROR: Dataset not found.")
    print(f"Expected: {DATA_PATH}")
    raise SystemExit(1)


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(
    DATA_PATH,
    low_memory=False,
)


# ============================================================
# BASIC INFORMATION
# ============================================================

print(f"\nRows: {len(df):,}")
print(f"Columns: {len(df.columns)}")


# ============================================================
# COLUMN TYPES
# ============================================================

print("\n" + "=" * 70)
print("COLUMN TYPES")
print("=" * 70)

for column in df.columns:

    print(
        f"{column}: "
        f"{df[column].dtype}"
    )


# ============================================================
# COMPOSITE RISK SCORE
# ============================================================

print("\n" + "=" * 70)
print("COMPOSITE RISK SCORE")
print("=" * 70)

print(
    df["composite_risk_score"]
    .describe()
)


# ============================================================
# ANOMALY LABEL
# ============================================================

print("\n" + "=" * 70)
print("ANOMALY LABEL")
print("=" * 70)

print(
    df["anomaly_label"]
    .value_counts(
        dropna=False
    )
)


# ============================================================
# FINANCIAL RISK SCORE
# ============================================================

print("\n" + "=" * 70)
print("FINANCIAL RISK SCORE")
print("=" * 70)

print(
    df["financial_risk_score"]
    .describe()
)


# ============================================================
# FLAGS
# ============================================================

flag_columns = [
    "flag_negative_timeline",
    "flag_near_5L_split",
    "flag_batch_split",
    "flag_ghost_asset",
    "flag_vague_desc",
]


print("\n" + "=" * 70)
print("FLAG COUNTS")
print("=" * 70)

for column in flag_columns:

    if column not in df.columns:
        print(
            f"{column}: COLUMN NOT FOUND"
        )
        continue

    values = pd.to_numeric(
        df[column],
        errors="coerce"
    ).fillna(0)

    print(
        f"{column}: "
        f"{int(values.sum()):,}"
    )


# ============================================================
# ML FEATURES
# ============================================================

ml_features = [
    "signed_log_zscore",
    "flag_near_5L_split",
    "log_cost_escalation",
    "flag_ghost_asset",
    "log_payment_count",
    "vendor_ida_concentration_ratio",
    "flag_negative_timeline",
]


print("\n" + "=" * 70)
print("ML FEATURE STATISTICS")
print("=" * 70)

for column in ml_features:

    if column not in df.columns:

        print(
            f"\n{column}: COLUMN NOT FOUND"
        )

        continue

    print(f"\n{column}:")

    print(
        df[column].describe()
    )


# ============================================================
# ALERT REASONS
# ============================================================

print("\n" + "=" * 70)
print("ALERT REASONS")
print("=" * 70)

print(
    df["alert_reasons"]
    .fillna("")
    .astype(str)
    .value_counts()
    .head(20)
)


# ============================================================
# STATES
# ============================================================

print("\n" + "=" * 70)
print("STATES")
print("=" * 70)

print(
    df["State"]
    .value_counts()
)


# ============================================================
# IDA
# ============================================================

print("\n" + "=" * 70)
print("IDA")
print("=" * 70)

print(
    f"Unique IDAs: "
    f"{df['IDA'].nunique()}"
)

print(
    df["IDA"]
    .value_counts()
    .head(20)
)


# ============================================================
# CATEGORIES
# ============================================================

print("\n" + "=" * 70)
print("TOP CATEGORIES")
print("=" * 70)

print(
    df["Category"]
    .value_counts()
    .head(20)
)


# ============================================================
# TOP RISK WORKS
# ============================================================

print("\n" + "=" * 70)
print("TOP 10 HIGHEST RISK WORKS")
print("=" * 70)

columns = [
    "Work ID",
    "Work Description",
    "Category",
    "MP Name",
    "Constituency",
    "State",
    "IDA",
    "composite_risk_score",
    "financial_risk_score",
    "anomaly_label",
    "alert_reasons",
]


print(
    df.nlargest(
        10,
        "composite_risk_score"
    )[columns]
    .to_string(index=False)
)


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 70)
print("Dataset inspection complete")
print("=" * 70)