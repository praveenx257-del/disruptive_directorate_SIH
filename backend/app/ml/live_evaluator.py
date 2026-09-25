from pathlib import Path
import hashlib
import json

import joblib
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer


# --------------------------------------------------
# Paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATA_DIR = PROJECT_ROOT / "data"
ML_DIR = PROJECT_ROOT / "ml"
CACHE_DIR = PROJECT_ROOT / "cache"

CACHE_DIR.mkdir(parents=True, exist_ok=True)

SCORED_RESULTS_PATH = DATA_DIR / "mplads_scored_results.csv"
MODEL_PATH = ML_DIR / "mplads_isoforest.joblib"
SCALER_PATH = ML_DIR / "mplads_scaler.joblib"

EMBEDDINGS_PATH = CACHE_DIR / "work_description_embeddings.npy"
EMBEDDING_METADATA_PATH = CACHE_DIR / "embedding_metadata.json"


# --------------------------------------------------
# Exact feature order
# --------------------------------------------------

FEATURE_COLS = [
    "signed_log_zscore",
    "flag_near_5L_split",
    "log_cost_escalation",
    "flag_ghost_asset",
    "log_payment_count",
    "vendor_ida_concentration_ratio",
    "flag_negative_timeline",
]


SEMANTIC_MODEL_NAME = "all-MiniLM-L6-v2"


# --------------------------------------------------
# Loaded objects
# --------------------------------------------------

_model = None
_scaler = None
_df = None

_cat_stats = None
_ida_totals = None
_vendor_ida_totals = None

_sentence_model = None
_description_embeddings = None


# --------------------------------------------------
# Dataset fingerprint
# --------------------------------------------------

def get_dataset_fingerprint(df):
    """
    Create a lightweight fingerprint from the Work IDs
    so cached embeddings cannot accidentally be paired
    with a different dataset.
    """

    work_ids = df["Work ID"].astype(str).tolist()

    digest = hashlib.sha256(
        "|".join(work_ids).encode("utf-8")
    ).hexdigest()

    return digest


# --------------------------------------------------
# Load Isolation Forest + dataset
# --------------------------------------------------

def load_live_evaluator():

    global _model
    global _scaler
    global _df
    global _cat_stats
    global _ida_totals
    global _vendor_ida_totals

    if _model is not None:
        return

    print("Loading JanAudit live ML artifacts...")

    _model = joblib.load(MODEL_PATH)

    _scaler = joblib.load(SCALER_PATH)

    _df = pd.read_csv(
        SCORED_RESULTS_PATH,
        low_memory=False
    )

    # ----------------------------------------------
    # Category statistics
    # ----------------------------------------------

    _cat_stats = (
        _df.groupby(
            ["State", "Category"]
        )["Recommended Amount (₹)"]
        .agg(["mean", "std"])
        .reset_index()
    )

    # ----------------------------------------------
    # IDA expenditure
    # ----------------------------------------------

    _ida_totals = (
        _df.groupby("IDA")["effective_spent_amt"]
        .sum()
        .to_dict()
    )

    # ----------------------------------------------
    # Vendor + IDA expenditure
    # ----------------------------------------------

    _vendor_ida_totals = (
        _df.groupby(
            ["IDA", "primary_vendor"]
        )["effective_spent_amt"]
        .sum()
        .to_dict()
    )

    print("Isolation Forest and feature lookups loaded.")


# --------------------------------------------------
# Load semantic model + cached embeddings
# --------------------------------------------------

def load_semantic_model():

    global _sentence_model
    global _description_embeddings

    load_live_evaluator()

    if _sentence_model is not None:
        return

    print(
        f"Loading SentenceTransformer: "
        f"{SEMANTIC_MODEL_NAME}"
    )

    _sentence_model = SentenceTransformer(
        SEMANTIC_MODEL_NAME
    )

    # ----------------------------------------------
    # Try cached embeddings
    # ----------------------------------------------

    current_fingerprint = get_dataset_fingerprint(
        _df
    )

    if (
        EMBEDDINGS_PATH.exists()
        and EMBEDDING_METADATA_PATH.exists()
    ):

        try:

            with open(
                EMBEDDING_METADATA_PATH,
                "r",
                encoding="utf-8"
            ) as f:
                metadata = json.load(f)

            cache_is_valid = (
                metadata.get("model_name")
                == SEMANTIC_MODEL_NAME
                and metadata.get("row_count")
                == len(_df)
                and metadata.get("dataset_fingerprint")
                == current_fingerprint
            )

            if cache_is_valid:

                print(
                    "Loading cached work embeddings..."
                )

                _description_embeddings = np.load(
                    EMBEDDINGS_PATH,
                    mmap_mode="r"
                )

                print(
                    "Cached embeddings loaded successfully."
                )

                print(
                    f"Embedding matrix shape: "
                    f"{_description_embeddings.shape}"
                )

                return

            print(
                "Embedding cache is outdated. "
                "Rebuilding..."
            )

        except Exception as e:

            print(
                f"Could not use embedding cache: {e}"
            )

            print(
                "Rebuilding embeddings..."
            )

    # ----------------------------------------------
    # Generate embeddings
    # ----------------------------------------------

    print(
        "Encoding existing work descriptions..."
    )

    descriptions = (
        _df["Work Description"]
        .fillna("")
        .astype(str)
        .tolist()
    )

    _description_embeddings = (
        _sentence_model.encode(
            descriptions,
            batch_size=128,
            show_progress_bar=True,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
    )

    print(
        "Semantic embeddings generated."
    )

    # ----------------------------------------------
    # Save embeddings
    # ----------------------------------------------

    print(
        "Saving embeddings to cache..."
    )

    np.save(
        EMBEDDINGS_PATH,
        _description_embeddings
    )

    metadata = {
        "model_name": SEMANTIC_MODEL_NAME,
        "row_count": len(_df),
        "embedding_dimension": int(
            _description_embeddings.shape[1]
        ),
        "dataset_fingerprint": current_fingerprint,
    }

    with open(
        EMBEDDING_METADATA_PATH,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            metadata,
            f,
            indent=2
        )

    print(
        "Semantic embedding cache saved."
    )


# --------------------------------------------------
# Build exact 7 features
# --------------------------------------------------

def build_7_features_for_scaler(
    state: str,
    ida: str,
    category: str,
    recommended_amt: float,
    disbursed_amt: float = 0.0,
    payment_tx_count: int = 0,
    vendor_name: str = "Unknown",
    has_images: bool = False,
    execution_days: int = 0,
    is_completed: bool = False,
) -> pd.DataFrame:

    load_live_evaluator()

    # 1. signed_log_zscore

    row = _cat_stats[
        (_cat_stats["State"].astype(str).str.lower()
         == state.strip().lower())
        &
        (_cat_stats["Category"].astype(str).str.lower()
         == category.strip().lower())
    ]

    if not row.empty:

        mean_c = float(
            row.iloc[0]["mean"]
        )

        std_c = float(
            row.iloc[0]["std"]
        )

        if np.isnan(std_c):
            std_c = 0.0

        z_score = (
            (recommended_amt - mean_c)
            / (std_c + 1e-5)
        )

    else:

        z_score = 0.0

    signed_log_zscore = float(
        np.sign(z_score)
        * np.log1p(abs(z_score))
    )

    # 2. flag_near_5L_split

    flag_near_5L_split = int(
        485000 <= recommended_amt < 500000
    )

    # 3. log_cost_escalation

    if recommended_amt > 0:

        cost_escalation_ratio = (
            disbursed_amt
            / recommended_amt
        )

    else:

        cost_escalation_ratio = 0.0

    log_cost_escalation = float(
        np.log1p(
            max(
                0.0,
                cost_escalation_ratio
            )
        )
    )

    # 4. flag_ghost_asset

    flag_ghost_asset = int(
        disbursed_amt >= recommended_amt > 0
        and not has_images
    )

    # 5. log_payment_count

    log_payment_count = float(
        np.log1p(
            max(
                0,
                payment_tx_count
            )
        )
    )

    # 6. vendor concentration

    ida_total = _ida_totals.get(
        ida,
        0.0
    )

    vendor_total = _vendor_ida_totals.get(
        (ida, vendor_name),
        0.0
    )

    if ida_total > 0:

        vendor_ida_concentration_ratio = float(
            vendor_total
            / (ida_total + 1e-5)
        )

    else:

        vendor_ida_concentration_ratio = 0.0

    # 7. negative timeline

    flag_negative_timeline = int(
        is_completed
        and execution_days < 0
    )

    return pd.DataFrame(
        [[
            signed_log_zscore,
            flag_near_5L_split,
            log_cost_escalation,
            flag_ghost_asset,
            log_payment_count,
            vendor_ida_concentration_ratio,
            flag_negative_timeline,
        ]],
        columns=FEATURE_COLS
    )


# --------------------------------------------------
# Isolation Forest
# --------------------------------------------------

def evaluate_model(
    features: pd.DataFrame
):

    load_live_evaluator()

    scaled_features = _scaler.transform(
        features[FEATURE_COLS]
    )

    prediction = _model.predict(
        scaled_features
    )

    decision_score = _model.decision_function(
        scaled_features
    )

    anomaly_label = int(
        prediction[0]
    )

    model_score = float(
        decision_score[0]
    )

    return {
        "anomaly_label": anomaly_label,
        "model_score": model_score,
        "is_anomaly": anomaly_label == -1,
    }


# --------------------------------------------------
# Semantic search — SAME IDA
# --------------------------------------------------

def find_semantic_match(
    work_description: str,
    ida: str,
):

    load_semantic_model()

    requested_ida = ida.strip().lower()

    # ----------------------------------------------
    # Match the requested IDA against the dataset.
    #
    # We support both:
    #   "JAUNPUR"
    #
    # and dataset values such as:
    #   "JAUNPUR(...)"
    #
    # Exact match is preferred.
    # ----------------------------------------------

    ida_values = (
        _df["IDA"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    ida_lower = ida_values.str.lower()

    # First try exact match
    exact_mask = ida_lower == requested_ida

    candidate_indices = np.flatnonzero(
        exact_mask.to_numpy()
    )

    # ----------------------------------------------
    # If exact match doesn't exist,
    # try prefix/substring matching.
    # ----------------------------------------------

    if len(candidate_indices) == 0:

        partial_mask = (
            ida_lower.str.startswith(
                requested_ida
            )
        )

        candidate_indices = np.flatnonzero(
            partial_mask.to_numpy()
        )

    # ----------------------------------------------
    # Still nothing?
    # ----------------------------------------------

    if len(candidate_indices) == 0:

        return {
            "matched_work_id": None,
            "similarity_score": None,
            "matched_description": None,
            "matched_state": None,
            "matched_ida": None,
            "candidate_count": 0,
        }

    # ----------------------------------------------
    # Encode new proposal
    # ----------------------------------------------

    query_embedding = _sentence_model.encode(
        [work_description],
        normalize_embeddings=True,
        convert_to_numpy=True,
    )[0]

    # ----------------------------------------------
    # Compare only against same-IDAs
    # ----------------------------------------------

    candidate_embeddings = (
        _description_embeddings[
            candidate_indices
        ]
    )

    similarities = (
        candidate_embeddings
        @ query_embedding
    )

    best_local_index = int(
        np.argmax(similarities)
    )

    best_global_index = int(
        candidate_indices[
            best_local_index
        ]
    )

    best_similarity = float(
        similarities[
            best_local_index
        ]
    )

    matched_row = _df.iloc[
        best_global_index
    ]

    return {
        "matched_work_id": int(
            matched_row["Work ID"]
        ),

        "similarity_score": best_similarity,

        "matched_description": str(
            matched_row["Work Description"]
        ),

        "matched_state": str(
            matched_row["State"]
        ),

        "matched_ida": str(
            matched_row["IDA"]
        ),

        "candidate_count": int(
            len(candidate_indices)
        ),
    }

# --------------------------------------------------
# Explain live evaluation
# --------------------------------------------------

def build_explanation(
    features: pd.DataFrame,
    model_result: dict,
    semantic_result: dict,
    recommended_amt: float,
    disbursed_amt: float,
    payment_tx_count: int,
    has_images: bool,
    execution_days: int,
    is_completed: bool,
):
    """
    Convert raw model/features into human-readable
    explanations for the frontend.

    This does NOT replace the Isolation Forest.
    It only explains observable feature conditions.
    """

    feature_row = features.iloc[0]

    alerts = []
    observations = []

    # --------------------------------------------------
    # Near ₹5 lakh threshold
    # --------------------------------------------------

    if int(feature_row["flag_near_5L_split"]) == 1:

        alerts.append({
            "code": "NEAR_5L_THRESHOLD",
            "severity": "high",
            "title": "Near ₹5 lakh threshold",
            "message": (
                "The recommended amount falls between "
                "₹4.85 lakh and ₹5 lakh."
            ),
        })

    # --------------------------------------------------
    # Ghost asset
    # --------------------------------------------------

    if int(feature_row["flag_ghost_asset"]) == 1:

        alerts.append({
            "code": "GHOST_ASSET",
            "severity": "high",
            "title": "Ghost-asset indicator",
            "message": (
                "The proposal is fully disbursed but "
                "no project image was provided."
            ),
        })

    # --------------------------------------------------
    # Negative timeline
    # --------------------------------------------------

    if int(feature_row["flag_negative_timeline"]) == 1:

        alerts.append({
            "code": "NEGATIVE_TIMELINE",
            "severity": "high",
            "title": "Negative execution timeline",
            "message": (
                "The completion timeline is negative."
            ),
        })

    # --------------------------------------------------
    # Payment activity
    # --------------------------------------------------

    if payment_tx_count > 0:

        observations.append({
            "code": "PAYMENT_ACTIVITY",
            "title": "Payment transactions",
            "message": (
                f"{payment_tx_count} payment transaction(s) "
                "were provided for this proposal."
            ),
        })

    else:

        observations.append({
            "code": "NO_PAYMENT_ACTIVITY",
            "title": "No payment transactions",
            "message": (
                "No payment transactions were provided."
            ),
        })

    # --------------------------------------------------
    # Cost escalation
    # --------------------------------------------------

    cost_ratio = (
        disbursed_amt / recommended_amt
        if recommended_amt > 0
        else 0.0
    )

    if cost_ratio > 1:

        percentage = (
            (cost_ratio - 1) * 100
        )

        alerts.append({
            "code": "COST_ESCALATION",
            "severity": "medium",
            "title": "Spending exceeds recommendation",
            "message": (
                f"Disbursed amount is approximately "
                f"{percentage:.1f}% above the recommended amount."
            ),
        })

    elif cost_ratio == 1 and recommended_amt > 0:

        observations.append({
            "code": "FULL_DISBURSEMENT",
            "title": "Full disbursement",
            "message": (
                "Disbursed amount equals the "
                "recommended amount."
            ),
        })

    # --------------------------------------------------
    # Semantic match
    # --------------------------------------------------

    similarity = semantic_result.get(
        "similarity_score"
    )

    if similarity is not None:

        observations.append({
            "code": "SEMANTIC_MATCH",
            "title": "Similar work found",
            "message": (
                "A semantically similar existing work "
                "was found within the same IDA."
            ),

            "matched_work_id": semantic_result.get(
                "matched_work_id"
            ),

            "similarity_score": similarity,

            "matched_description": semantic_result.get(
                "matched_description"
            ),

            "matched_ida": semantic_result.get(
                "matched_ida"
            ),
        })

    # --------------------------------------------------
    # Model result
    # --------------------------------------------------

    if model_result["is_anomaly"]:

        model_summary = {
            "status": "anomaly",
            "title": "Isolation Forest anomaly detected",
            "message": (
                "The trained Isolation Forest classified "
                "this proposal as anomalous."
            ),
        }

    else:

        model_summary = {
            "status": "normal",
            "title": "No Isolation Forest anomaly detected",
            "message": (
                "The trained Isolation Forest did not "
                "classify this proposal as anomalous."
            ),
        }

    # --------------------------------------------------
    # Feature snapshot
    # --------------------------------------------------

    feature_snapshot = {
        "signed_log_zscore": float(
            feature_row["signed_log_zscore"]
        ),

        "near_5L_split": bool(
            feature_row["flag_near_5L_split"]
        ),

        "log_cost_escalation": float(
            feature_row["log_cost_escalation"]
        ),

        "ghost_asset": bool(
            feature_row["flag_ghost_asset"]
        ),

        "log_payment_count": float(
            feature_row["log_payment_count"]
        ),

        "vendor_ida_concentration_ratio": float(
            feature_row[
                "vendor_ida_concentration_ratio"
            ]
        ),

        "negative_timeline": bool(
            feature_row["flag_negative_timeline"]
        ),
    }

    return {
        "model_summary": model_summary,

        "alerts": alerts,

        "observations": observations,

        "feature_snapshot": feature_snapshot,
    }

def evaluate_live_proposal(
    state: str,
    ida: str,
    category: str,
    work_description: str,
    recommended_amt: float,
    disbursed_amt: float = 0.0,
    payment_tx_count: int = 0,
    vendor_name: str = "Unknown",
    has_images: bool = False,
    execution_days: int = 0,
    is_completed: bool = False,
):

    # ----------------------------------------------
    # Build exact 7 ML features
    # ----------------------------------------------

    features = build_7_features_for_scaler(
        state=state,
        ida=ida,
        category=category,
        recommended_amt=recommended_amt,
        disbursed_amt=disbursed_amt,
        payment_tx_count=payment_tx_count,
        vendor_name=vendor_name,
        has_images=has_images,
        execution_days=execution_days,
        is_completed=is_completed,
    )

    # ----------------------------------------------
    # Isolation Forest
    # ----------------------------------------------

    model_result = evaluate_model(
        features
    )

    # ----------------------------------------------
    # Same-IDA semantic search
    # ----------------------------------------------

    semantic_result = find_semantic_match(
        work_description=work_description,
        ida=ida,
    )

    # ----------------------------------------------
    # Human-readable explanation
    # ----------------------------------------------

    explanation = build_explanation(
        features=features,
        model_result=model_result,
        semantic_result=semantic_result,
        recommended_amt=recommended_amt,
        disbursed_amt=disbursed_amt,
        payment_tx_count=payment_tx_count,
        has_images=has_images,
        execution_days=execution_days,
        is_completed=is_completed,
    )

    # ----------------------------------------------
    # Final API result
    # ----------------------------------------------

    return {

        "features": {
            column: float(
                features.iloc[0][column]
            )
            for column in FEATURE_COLS
        },

        "model": model_result,

        "semantic_match": semantic_result,

        "explanation": explanation,
    }