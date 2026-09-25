# JanAudit — MPLADS AI Watchdog

> **AI-assisted monitoring and anomaly detection platform for MPLADS works, expenditure patterns, and proposed projects.**

JanAudit is an end-to-end intelligence and audit dashboard designed to help monitor public development works using data-driven anomaly detection, risk scoring, semantic similarity analysis, and interactive geographic and parliamentary scorecards.

The platform combines a **FastAPI backend**, **React frontend**, **trained Isolation Forest model**, and **SentenceTransformer-based semantic duplicate detection** into a unified audit command center.

---

## 🚨 Problem

Public development schemes generate large volumes of project and expenditure data.

Manually reviewing every work for suspicious patterns can be difficult because:

- Thousands of works may be active simultaneously.
- Multiple works can have similar descriptions.
- Projects may be clustered around financial thresholds.
- Expenditure can significantly exceed recommended amounts.
- Projects may be fully disbursed without supporting images.
- Multiple works can exhibit unusual payment or vendor patterns.
- Risk signals can be distributed across different districts and constituencies.

JanAudit provides an intelligence layer over this data to surface potentially unusual works and help auditors focus their attention where they matter most.

---

## 🎯 Objectives

JanAudit is designed to:

- Monitor large numbers of MPLADS works.
- Identify anomalous works using a trained machine-learning model.
- Detect suspicious financial and operational patterns.
- Identify semantically similar or potentially duplicate works.
- Provide district-level risk analysis.
- Provide MP-level scorecards.
- Allow live evaluation of proposed works.
- Explain detected signals instead of returning only a black-box prediction.
- Present the information through an interactive audit command center.

---

# ✨ Key Features

## 1. National Monitoring Dashboard

The dashboard provides a high-level overview of the complete scored dataset.

It includes:

- Total works
- Anomalous works
- High-risk works
- Average composite risk
- Risk distribution
- Detection signal counts
- Ghost-asset indicators
- Batch-split indicators
- Near-₹5 lakh threshold indicators
- Vague-description indicators

---

## 2. AI Watchlist

The Watchlist provides an interactive view of potentially suspicious works.

Users can filter works by:

- Minimum risk score
- State
- Anomaly status
- Number of results

Each work provides information such as:

- Work ID
- Work description
- Category
- State
- Constituency
- Recommended amount
- Final amount
- Effective expenditure
- Composite risk score
- Isolation Forest anomaly status
- Alert reasons

Selecting a work opens a detailed audit view containing:

- Location
- Financial profile
- Detection signals
- Timeline
- Image availability
- MP information
- House
- Primary vendor
- Identical-work information

---

## 3. District Risk Intelligence

The District Risk module aggregates work-level signals across Implementing District Authorities (IDAs).

It provides:

- Number of districts / IDAs
- Works covered
- Anomalous works
- High-risk works
- Average risk
- Total expenditure
- Detection signal counts

Users can search and filter districts by state.

---

## 4. MP Scorecards

The MP Scorecards module provides a parliamentary-level view of MPLADS activity.

Each scorecard includes:

- MP name
- Constituency
- State
- House
- Allocated amount
- Recommended amount
- Total expenditure
- Utilization percentage
- Completed works
- Recommended works
- Completion rate
- Vendor payment balance
- Transaction count
- Successful payments
- Pending payments
- Average rating

---

## 5. Live Proposal Evaluation

JanAudit can evaluate a newly proposed work through:

```http
POST /api/evaluate_live
```

The proposal is processed using:

1. Feature generation
2. Feature scaling
3. Trained Isolation Forest inference
4. Semantic similarity analysis
5. Detection-signal extraction
6. Human-readable explanation generation

The response contains:

- Generated ML features
- Isolation Forest anomaly label
- Model score
- Anomaly status
- Semantic match
- Similarity score
- Detection alerts
- Observations
- Feature snapshot

---

# 🧠 Machine Learning

JanAudit uses a trained **Isolation Forest** model for anomaly detection.

The trained artifacts are:

```text
ml/
├── mplads_isoforest.joblib
└── mplads_scaler.joblib
```

The model was trained externally and integrated into the JanAudit backend.

The application does **not retrain the model at runtime**.

---

## Isolation Forest Features

The trained model expects exactly seven features in the following order:

```text
1. signed_log_zscore
2. flag_near_5L_split
3. log_cost_escalation
4. flag_ghost_asset
5. log_payment_count
6. vendor_ida_concentration_ratio
7. flag_negative_timeline
```

### 1. Signed Log Z-Score

Measures how unusual a recommended project amount is relative to the relevant project distribution.

The resulting value is transformed using a signed logarithmic transformation before being passed to the model.

---

### 2. Near ₹5 Lakh Split

Flags proposals falling within the near-threshold range:

```text
₹4.85 lakh <= recommended amount < ₹5 lakh
```

This provides a signal for works clustered immediately below the ₹5 lakh threshold.

---

### 3. Log Cost Escalation

Measures the relationship between effective expenditure and recommended amount.

Conceptually:

```text
cost_escalation_ratio =
    effective_spent_amt / recommended_amt
```

The model uses the logarithmic transformation:

```text
log1p(cost_escalation_ratio)
```

---

### 4. Ghost Asset Indicator

A ghost-asset signal is generated when a project is fully disbursed while no supporting project image is available.

Conceptually:

```text
effective_spent_amt >= recommended_amt
AND
no project image is available
```

---

### 5. Log Payment Count

Payment activity is represented using a logarithmic transformation of the payment transaction count:

```text
log1p(payment_transaction_count)
```

---

### 6. Vendor-IDA Concentration Ratio

Measures vendor expenditure concentration within an Implementing District Authority.

For live proposals where no vendor concentration information is available, the value can be represented as:

```text
0.0
```

---

### 7. Negative Timeline

Flags projects where the timeline is inconsistent with the expected chronological order.

Conceptually:

```text
execution_days < 0
```

---

# 🔎 Semantic Duplicate Detection

JanAudit uses:

```text
SentenceTransformer
all-MiniLM-L6-v2
```

to compare a new work description against existing work descriptions.

The system:

1. Encodes existing work descriptions.
2. Stores the resulting embedding matrix.
3. Encodes the newly submitted description.
4. Calculates semantic similarity.
5. Searches for similar existing works.
6. Returns the strongest matching candidate.

A live evaluation can return information such as:

```json
{
  "matched_work_id": 204469,
  "similarity_score": 0.4698,
  "matched_description": "Construction of room in school",
  "matched_state": "Uttar Pradesh",
  "matched_ida": "JAUNPUR(DISTRICT MAGISTRATE JAUNPUR_IDA)"
}
```

This provides an additional signal alongside the ML anomaly prediction.

---

# 🏗️ System Architecture

```text
                         ┌───────────────────────┐
                         │       React UI        │
                         │                       │
                         │  Dashboard            │
                         │  Watchlist            │
                         │  District Risk        │
                         │  MP Scorecards        │
                         │  Live Evaluation      │
                         └───────────┬───────────┘
                                     │
                                  REST API
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │       FastAPI         │
                         │       Backend         │
                         ├───────────────────────┤
                         │ API Routes             │
                         │ Data Services          │
                         │ ML Evaluation          │
                         │ Explainability         │
                         └───────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
     ┌────────────────┐    ┌────────────────┐    ┌─────────────────┐
     │ Scored Dataset │    │ Isolation      │    │ Sentence        │
     │                │    │ Forest         │    │ Transformer     │
     │ 87K+ works     │    │ + Scaler       │    │ Embeddings      │
     └────────────────┘    └────────────────┘    └─────────────────┘
```

---

# 📁 Project Structure

```text
disruptive_directorate_SIH/
│
├── backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── summary.py
│   │   │   ├── watchlist.py
│   │   │   ├── district_risk.py
│   │   │   ├── mp_scorecards.py
│   │   │   └── evaluate_live.py
│   │   │
│   │   ├── core/
│   │   │
│   │   ├── data/
│   │   │   ├── loader.py
│   │   │   └── ...
│   │   │
│   │   ├── ml/
│   │   │   ├── inspect_model.py
│   │   │   ├── live_evaluator.py
│   │   │   └── ...
│   │   │
│   │   ├── schemas/
│   │   │   └── live_evaluation.py
│   │   │
│   │   ├── services/
│   │   │   └── data_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── tests/
│   └── requirements.txt
│
├── data/
│   ├── mplads_scored_results.csv
│   └── mp_summary.csv
│
├── ml/
│   ├── mplads_isoforest.joblib
│   └── mplads_scaler.joblib
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Watchlist.jsx
│   │   │   ├── DistrictRisk.jsx
│   │   │   ├── MPScorecards.jsx
│   │   │   └── LiveEvaluation.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

# 📊 Dataset

The primary runtime dataset is:

```text
data/mplads_scored_results.csv
```

It contains:

```text
87,272 works
38 columns
```

The dataset contains information including:

- Work information
- MP information
- Constituency
- State
- House
- Recommended amount
- Final amount
- Expenditure information
- Timeline information
- Vendor information
- IDA information
- Anomaly labels
- Financial risk scores
- Detection flags
- Alert reasons
- Composite risk scores

The MP scorecard dataset is:

```text
data/mp_summary.csv
```

It contains:

```text
774 rows
16 columns
```

---

# 🔌 API Reference

## Health Check

```http
GET /api/health
```

Checks whether the backend is running.

---

## National Summary

```http
GET /api/summary
```

Returns national monitoring statistics including:

- Total works
- Anomalous works
- High-risk works
- Average risk
- Risk distribution
- Detection signals

---

## Watchlist

```http
GET /api/watchlist
```

Returns filtered and paginated works.

Example:

```http
GET /api/watchlist?limit=20&min_risk=50
```

Possible query parameters include:

```text
limit
min_risk
state
anomaly_only
```

---

## District Risk

```http
GET /api/district_risk
```

Returns aggregated risk information by IDA / district.

Example:

```http
GET /api/district_risk?limit=50
```

---

## MP Scorecards

```http
GET /api/mp_scorecards
```

Returns MP-level scorecard information.

Example:

```http
GET /api/mp_scorecards?limit=20
```

---

## Live Evaluation

```http
POST /api/evaluate_live
```

Example request:

```json
{
  "state": "Uttar Pradesh",
  "ida": "JAUNPUR",
  "category": "Normal/Others",
  "work_description": "Construction of community road near village school",
  "recommended_amt": 490000,
  "disbursed_amt": 490000,
  "payment_tx_count": 3,
  "vendor_name": "Unknown",
  "has_images": false,
  "execution_days": 100,
  "is_completed": true
}
```

Example response structure:

```json
{
  "status": "evaluated",
  "proposal": {},
  "features": {},
  "model": {},
  "semantic_match": {},
  "explanation": {}
}
```

---

# 🖥️ Frontend

The frontend is built using:

- React
- Vite
- Tailwind CSS
- JavaScript

The interface follows a dark command-center design.

Main modules:

```text
Dashboard
Watchlist
District Risk
MP Scorecards
Live Evaluation
```

The frontend communicates with the FastAPI backend through REST APIs.

---

# ⚙️ Installation

## Prerequisites

Install:

- Python
- Node.js
- npm
- Git

---

# 🐍 Backend Setup

Navigate to the backend:

```powershell
cd backend
```

Create a virtual environment:

```powershell
python -m venv venv
```

Activate the environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

---

# ▶️ Start the Backend

From the `backend` directory:

```powershell
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

OpenAPI specification:

```text
http://127.0.0.1:8000/openapi.json
```

---

# ⚛️ Frontend Setup

Open another terminal.

Navigate to:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Vite will provide a local URL, typically:

```text
http://localhost:5173
```

---

# 🚀 Running the Complete System

### Terminal 1 — Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

### Terminal 2 — Frontend

```powershell
cd frontend
npm run dev
```

Then open the URL provided by Vite.

The complete flow is:

```text
Browser
   │
   ▼
React + Vite
   │
   │ REST API
   ▼
FastAPI
   │
   ├── Scored Dataset
   ├── MP Summary
   ├── Isolation Forest
   ├── StandardScaler
   └── SentenceTransformer
```

---

# 📌 Explainability

JanAudit does not return only a binary anomaly prediction.

The live evaluation system provides an explanation structure containing:

## Model Summary

Example:

```text
Isolation Forest anomaly detected
```

## Alerts

Examples:

```text
NEAR_5L_THRESHOLD
GHOST_ASSET
```

## Observations

Examples:

```text
PAYMENT_ACTIVITY
FULL_DISBURSEMENT
SEMANTIC_MATCH
```

## Feature Snapshot

The seven model features are returned so users can inspect the values supplied to the trained model.

This makes the system easier to understand during audit workflows.

---

# 📈 Risk Signals

Important signals available in the scored dataset include:

| Signal | Description |
|---|---|
| `flag_negative_timeline` | Timeline inconsistency indicator |
| `flag_near_5L_split` | Work falling immediately below the ₹5 lakh threshold |
| `flag_batch_split` | Multiple similar works grouped within an IDA |
| `flag_ghost_asset` | Full expenditure without available project image |
| `flag_vague_desc` | Potentially vague work description |
| `financial_risk_score` | Financial risk indicator |
| `composite_risk_score` | Combined scored risk measure |
| `anomaly_label` | Isolation Forest anomaly label in the scored dataset |
| `semantic_similarity_score` | Similarity to another work |
| `alert_reasons` | Recorded detection signals |

---

# ⚡ Performance Design

The backend is designed to load important resources once rather than repeatedly reading them for every API request.

Resources include:

```text
Scored dataset
MP summary
Isolation Forest
Scaler
SentenceTransformer
Existing work embeddings
```

This allows API requests to operate primarily against in-memory data structures.

---

# 🧩 Technology Stack

## Frontend

```text
React
Vite
Tailwind CSS
JavaScript
```

## Backend

```text
Python
FastAPI
Uvicorn
Pandas
NumPy
Pydantic
```

## Machine Learning

```text
Scikit-learn
Isolation Forest
StandardScaler
Joblib
```

## Semantic Search

```text
Sentence Transformers
all-MiniLM-L6-v2
```

## Development

```text
Git
GitHub
VS Code
```

---

# 📦 ML Artifacts

The trained artifacts are:

```text
ml/mplads_isoforest.joblib
ml/mplads_scaler.joblib
```

The scaler and model must be used together.

The scaler expects the following exact feature order:

```python
[
    "signed_log_zscore",
    "flag_near_5L_split",
    "log_cost_escalation",
    "flag_ghost_asset",
    "log_payment_count",
    "vendor_ida_concentration_ratio",
    "flag_negative_timeline"
]
```

Changing the order can produce incorrect model input.

---

# ⚠️ Runtime Compatibility

The serialized scikit-learn model artifacts should ideally be loaded using the same scikit-learn version used during training.

A mismatch between training and inference environments can produce compatibility warnings and may affect serialized model behavior.

For reliable deployment, the training and inference environments should be aligned.

---

# 🔐 Security & Production Considerations

The current application is designed as a prototype / hackathon system.

For production deployment:

- Restrict CORS to trusted frontend domains.
- Add authentication and authorization.
- Protect sensitive APIs.
- Validate all user input.
- Avoid committing secrets or API keys.
- Use HTTPS.
- Add rate limiting.
- Add structured logging.
- Add API monitoring.
- Store large datasets in a production database.
- Maintain audit logs.
- Protect sensitive project information.

---

# 🛠️ Future Improvements

Potential future improvements include:

- Authentication and role-based access control
- Production database integration
- Interactive geographic maps
- Advanced district visualization
- Work-level audit timelines
- Automated PDF audit reports
- Evidence/document uploads
- Image verification
- Vendor network analysis
- More advanced duplicate detection
- Model monitoring
- Automated model retraining pipelines
- Historical risk trends
- Notifications and alerts
- Docker containerization
- CI/CD pipelines
- Cloud deployment

---

# 🎯 Project Vision

JanAudit aims to transform large-scale public development data from a passive reporting system into an **active audit intelligence platform**.

Instead of requiring an auditor to manually inspect thousands of records, JanAudit surfaces:

```text
What looks unusual?
        ↓
Where is the risk concentrated?
        ↓
Which works require attention?
        ↓
Why was the work flagged?
        ↓
Are similar works already present?
```

The system is designed to **assist human auditors**, not replace them.

Its purpose is to provide a data-driven intelligence layer that helps prioritize investigations and understand the evidence behind detected signals.

---

# 🏆 Project Summary

```text
                JAN AUDIT
             MPLADS AI WATCHDOG

        ┌─────────────────────────┐
        │     Public Works Data   │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │   Risk & Feature Engine │
        └────────────┬────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
 ┌─────────────────┐   ┌──────────────────┐
 │ Isolation Forest│   │ Semantic Matching│
 └────────┬────────┘   └─────────┬────────┘
          │                      │
          └──────────┬───────────┘
                     ▼
        ┌─────────────────────────┐
        │   Explainable Results   │
        └────────────┬────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │   JanAudit Dashboard    │
        ├─────────────────────────┤
        │ Dashboard               │
        │ Watchlist               │
        │ District Risk           │
        │ MP Scorecards           │
        │ Live Evaluation         │
        └─────────────────────────┘
```

---

# 👥 Team Project

**JanAudit — MPLADS AI Watchdog**

Developed as a hackathon / Smart India Hackathon-style prototype.

### Core Components

```text
Data Engineering
        +
Machine Learning
        +
Semantic Similarity
        +
FastAPI
        +
React
        +
Interactive Intelligence Dashboard
        =
JanAudit
```

---

# 📄 License

This project is currently developed as a prototype for demonstration and hackathon purposes.

Add an appropriate open-source license if the project is later released under one.

---

## ⭐ JanAudit

**Turning public development data into actionable audit intelligence.**
