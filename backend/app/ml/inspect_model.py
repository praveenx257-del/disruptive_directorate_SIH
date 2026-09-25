from pathlib import Path
import sys

import joblib


# ============================================================
# PATHS
# ============================================================

# File location:
# JanAudit/backend/app/ml/inspect_model.py
#
# We need to reach:
# JanAudit/ml/

BASE_DIR = Path(__file__).resolve().parents[3]

ML_DIR = BASE_DIR / "ml"

MODEL_PATH = ML_DIR / "mplads_isoforest.joblib"
SCALER_PATH = ML_DIR / "mplads_scaler.joblib"


# ============================================================
# HEADER
# ============================================================

print("=" * 60)
print("JanAudit ML Artifact Inspection")
print("=" * 60)

print("\nModel path:")
print(MODEL_PATH)

print("\nScaler path:")
print(SCALER_PATH)


# ============================================================
# CHECK FILES
# ============================================================

if not MODEL_PATH.exists():
    print("\nERROR: Isolation Forest model not found.")
    print(f"Expected file: {MODEL_PATH}")
    sys.exit(1)

if not SCALER_PATH.exists():
    print("\nERROR: Scaler not found.")
    print(f"Expected file: {SCALER_PATH}")
    sys.exit(1)


print("\nBoth ML artifacts found.")


# ============================================================
# LOAD ARTIFACTS
# ============================================================

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

except Exception as e:
    print("\nERROR: Could not load ML artifacts.")
    print(f"Reason: {e}")
    sys.exit(1)


# ============================================================
# MODEL INFORMATION
# ============================================================

print("\n" + "=" * 60)
print("MODEL")
print("=" * 60)

print(f"\nModel type: {type(model).__name__}")

if hasattr(model, "n_features_in_"):
    print(
        f"Number of input features: "
        f"{model.n_features_in_}"
    )
else:
    print("Number of input features: Not available")


if hasattr(model, "feature_names_in_"):

    print("\nModel feature names:")

    for feature in model.feature_names_in_:
        print(f"  - {feature}")

else:

    print("\nModel feature names: Not available")


# ============================================================
# SCALER INFORMATION
# ============================================================

print("\n" + "=" * 60)
print("SCALER")
print("=" * 60)

print(f"\nScaler type: {type(scaler).__name__}")

if hasattr(scaler, "n_features_in_"):
    print(
        f"Number of input features: "
        f"{scaler.n_features_in_}"
    )
else:
    print("Number of input features: Not available")


if hasattr(scaler, "feature_names_in_"):

    print("\nScaler feature names:")

    for feature in scaler.feature_names_in_:
        print(f"  - {feature}")

else:

    print("\nScaler feature names: Not available")


# ============================================================
# SCALER PARAMETERS
# ============================================================

if hasattr(scaler, "mean_"):

    print("\nScaler means:")

    for index, value in enumerate(scaler.mean_):

        print(
            f"  Feature {index + 1}: "
            f"{value}"
        )


if hasattr(scaler, "scale_"):

    print("\nScaler scales:")

    for index, value in enumerate(scaler.scale_):

        print(
            f"  Feature {index + 1}: "
            f"{value}"
        )


# ============================================================
# MODEL PARAMETERS
# ============================================================

print("\n" + "=" * 60)
print("MODEL PARAMETERS")
print("=" * 60)

if hasattr(model, "get_params"):

    parameters = model.get_params()

    for key, value in parameters.items():

        print(
            f"  {key}: {value}"
        )

else:

    print("Model parameters not available.")


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 60)
print("ML Artifact Inspection Complete")
print("=" * 60)