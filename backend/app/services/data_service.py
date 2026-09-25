from pathlib import Path
import pandas as pd


# data_service.py
# Location:
# JanAudit/backend/app/services/data_service.py

# parents[0] = services
# parents[1] = app
# parents[2] = backend
# parents[3] = JanAudit
PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATA_DIR = PROJECT_ROOT / "data"

SCORED_RESULTS_PATH = DATA_DIR / "mplads_scored_results.csv"
MP_SUMMARY_PATH = DATA_DIR / "mp_summary.csv"


_scored_results = None
_mp_summary = None


def load_data():
    global _scored_results, _mp_summary

    if _scored_results is None:
        if not SCORED_RESULTS_PATH.exists():
            raise FileNotFoundError(
                f"Scored results file not found: {SCORED_RESULTS_PATH}"
            )

        _scored_results = pd.read_csv(
            SCORED_RESULTS_PATH,
            low_memory=False
        )

    if _mp_summary is None:
        if not MP_SUMMARY_PATH.exists():
            raise FileNotFoundError(
                f"MP summary file not found: {MP_SUMMARY_PATH}"
            )

        _mp_summary = pd.read_csv(
            MP_SUMMARY_PATH,
            low_memory=False
        )

    return {
        "scored_results": _scored_results,
        "mp_summary": _mp_summary
    }


def get_scored_results():
    if _scored_results is None:
        load_data()

    return _scored_results


def get_mp_summary():
    if _mp_summary is None:
        load_data()

    return _mp_summary  