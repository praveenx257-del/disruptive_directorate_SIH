from pathlib import Path

import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_DIR = BASE_DIR.parent / "data"

SCORED_RESULTS_PATH = DATA_DIR / "mplads_scored_results.csv"
MP_SUMMARY_PATH = DATA_DIR / "mp_summary.csv"


# ============================================================
# LOAD DATASETS
# ============================================================

def load_scored_results() -> pd.DataFrame:
    """
    Load the complete scored MPLADS dataset.
    """

    if not SCORED_RESULTS_PATH.exists():
        raise FileNotFoundError(
            f"Scored results file not found: "
            f"{SCORED_RESULTS_PATH}"
        )

    return pd.read_csv(
        SCORED_RESULTS_PATH,
        low_memory=False,
    )


def load_mp_summary() -> pd.DataFrame:
    """
    Load the MP-level summary dataset.
    """

    if not MP_SUMMARY_PATH.exists():
        raise FileNotFoundError(
            f"MP summary file not found: "
            f"{MP_SUMMARY_PATH}"
        )

    return pd.read_csv(
        MP_SUMMARY_PATH,
        low_memory=False,
    )


# ============================================================
# LOAD ALL DATA
# ============================================================

def load_all_data():
    """
    Load all runtime datasets used by JanAudit.
    """

    scored_results = load_scored_results()
    mp_summary = load_mp_summary()

    return {
        "scored_results": scored_results,
        "mp_summary": mp_summary,
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("JanAudit Data Loader")
    print("=" * 60)

    data = load_all_data()

    scored_results = data["scored_results"]
    mp_summary = data["mp_summary"]

    print(
        f"\nScored results:"
        f" {len(scored_results):,} rows"
        f" × {len(scored_results.columns)} columns"
    )

    print(
        f"MP summary:"
        f" {len(mp_summary):,} rows"
        f" × {len(mp_summary.columns)} columns"
    )

    print("\nScored results columns:")
    for column in scored_results.columns:
        print(f"  - {column}")

    print("\nMP summary columns:")
    for column in mp_summary.columns:
        print(f"  - {column}")

    print("\nData loading successful.")