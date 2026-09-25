import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const initialForm = {
  state: "Uttar Pradesh",
  ida: "JAUNPUR",
  category: "Normal/Others",
  work_description: "Construction of community road near village school",
  recommended_amt: 490000,
  disbursed_amt: 490000,
  payment_tx_count: 3,
  vendor_name: "Unknown",
  has_images: false,
  execution_days: 100,
  is_completed: true,
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatScore(value) {
  return Number(value || 0).toFixed(3);
}

function FeatureCard({ label, value, danger = false }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-semibold ${
          danger ? "text-red-400" : "text-white"
        }`}
      >
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
      </p>
    </div>
  );
}

function LiveEvaluation() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function evaluateProposal(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const payload = {
        ...form,
        recommended_amt: Number(form.recommended_amt),
        disbursed_amt: Number(form.disbursed_amt),
        payment_tx_count: Number(form.payment_tx_count),
        execution_days: Number(form.execution_days),
        has_images: Boolean(form.has_images),
        is_completed: Boolean(form.is_completed),
      };

      const response = await fetch(`${API_BASE}/api/evaluate_live`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `API returned ${response.status}`);
      }

      const data = await response.json();

      setResult(data);
    } catch (err) {
      console.error("Live evaluation error:", err);
      setError(err.message || "Failed to evaluate proposal");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setResult(null);
    setError("");
  }

  const model = result?.model;
  const features = result?.features;
  const semantic = result?.semantic_match;
  const explanation = result?.explanation;

  return (
    <div className="space-y-7">

      {/* Header */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400" />

          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
            AI Proposal Screening
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white">
          Live Evaluation
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Submit a proposed MPLADS work and evaluate it using the trained
          Isolation Forest model and semantic duplicate detection system.
        </p>
      </div>

      {/* Main layout */}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

        {/* Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Proposal Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the proposal attributes for screening.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Reset
            </button>
          </div>

          <form onSubmit={evaluateProposal} className="mt-6 space-y-5">

            {/* State / IDA */}
            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="text-xs font-medium text-slate-500">
                  State
                </label>

                <input
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="e.g. Uttar Pradesh"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  IDA
                </label>

                <input
                  value={form.ida}
                  onChange={(e) => updateField("ida", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="e.g. JAUNPUR"
                />
              </div>

            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-slate-500">
                Category
              </label>

              <input
                value={form.category}
                onChange={(e) =>
                  updateField("category", e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-slate-500">
                Work Description
              </label>

              <textarea
                value={form.work_description}
                onChange={(e) =>
                  updateField("work_description", e.target.value)
                }
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                placeholder="Describe the proposed work..."
              />
            </div>

            {/* Amounts */}
            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Recommended Amount (₹)
                </label>

                <input
                  type="number"
                  value={form.recommended_amt}
                  onChange={(e) =>
                    updateField("recommended_amt", e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Disbursed Amount (₹)
                </label>

                <input
                  type="number"
                  value={form.disbursed_amt}
                  onChange={(e) =>
                    updateField("disbursed_amt", e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* Payment / vendor */}
            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Payment Transactions
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.payment_tx_count}
                  onChange={(e) =>
                    updateField("payment_tx_count", e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Vendor
                </label>

                <input
                  value={form.vendor_name}
                  onChange={(e) =>
                    updateField("vendor_name", e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* Timeline */}
            <div>
              <label className="text-xs font-medium text-slate-500">
                Execution Days
              </label>

              <input
                type="number"
                value={form.execution_days}
                onChange={(e) =>
                  updateField("execution_days", e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Toggles */}
            <div className="grid gap-3 sm:grid-cols-2">

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">

                <span>
                  <span className="block text-sm font-medium text-white">
                    Project Images
                  </span>

                  <span className="mt-1 block text-xs text-slate-600">
                    Images available
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={form.has_images}
                  onChange={(e) =>
                    updateField("has_images", e.target.checked)
                  }
                  className="h-4 w-4 accent-blue-500"
                />

              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">

                <span>
                  <span className="block text-sm font-medium text-white">
                    Completed
                  </span>

                  <span className="mt-1 block text-xs text-slate-600">
                    Work is completed
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={form.is_completed}
                  onChange={(e) =>
                    updateField("is_completed", e.target.checked)
                  }
                  className="h-4 w-4 accent-blue-500"
                />

              </label>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Evaluating Proposal..." : "Evaluate Proposal"}
            </button>

          </form>

        </div>

        {/* Result */}
        <div className="space-y-5">

          {!result && !loading && (
            <div className="flex min-h-[620px] items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">

              <div className="max-w-md px-8 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-2xl">
                  ◈
                </div>

                <h2 className="mt-5 text-xl font-semibold text-white">
                  Ready for Evaluation
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Submit a proposal on the left. JanAudit will run the
                  trained anomaly model and search for semantically similar
                  existing works.
                </p>

              </div>

            </div>
          )}

          {loading && (
            <div className="flex min-h-[620px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/20">

              <div className="text-center">

                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

                <p className="mt-5 text-sm font-medium text-white">
                  Running AI evaluation...
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Checking anomaly signals and semantic similarity
                </p>

              </div>

            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-5">

              <p className="font-semibold text-red-400">
                Evaluation failed
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-red-300/70">
                {error}
              </p>

            </div>
          )}

          {result && !loading && (
            <>
              {/* Model status */}
              <div
                className={`rounded-2xl border p-6 ${
                  model?.is_anomaly
                    ? "border-red-900/70 bg-red-950/30"
                    : "border-emerald-900/60 bg-emerald-950/20"
                }`}
              >

                <div className="flex items-start justify-between gap-5">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      AI Assessment
                    </p>

                    <h2
                      className={`mt-3 text-3xl font-bold ${
                        model?.is_anomaly
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {model?.is_anomaly
                        ? "Anomaly Detected"
                        : "No Anomaly Detected"}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      {explanation?.model_summary?.message ||
                        "Proposal evaluated by the trained Isolation Forest model."}
                    </p>

                  </div>

                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl border text-xl ${
                      model?.is_anomaly
                        ? "border-red-900 bg-red-950/50 text-red-400"
                        : "border-emerald-900 bg-emerald-950/50 text-emerald-400"
                    }`}
                  >
                    {model?.is_anomaly ? "!" : "✓"}
                  </div>

                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-slate-800/70 bg-slate-950/50 p-4">
                    <p className="text-xs text-slate-600">
                      Anomaly Label
                    </p>

                    <p className="mt-2 text-xl font-bold text-white">
                      {model?.anomaly_label}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/70 bg-slate-950/50 p-4">
                    <p className="text-xs text-slate-600">
                      Model Score
                    </p>

                    <p className="mt-2 text-xl font-bold text-white">
                      {formatScore(model?.model_score)}
                    </p>
                  </div>

                </div>

              </div>

              {/* Alerts */}
              {explanation?.alerts?.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">
                      Detection Signals
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Signals identified during evaluation.
                    </p>
                  </div>

                  <div className="space-y-3">

                    {explanation.alerts.map((alert, index) => (
                      <div
                        key={`${alert.code}-${index}`}
                        className="rounded-xl border border-red-900/50 bg-red-950/20 p-4"
                      >

                        <div className="flex items-start gap-3">

                          <span className="mt-0.5 text-red-400">
                            !
                          </span>

                          <div>

                            <p className="font-semibold text-red-300">
                              {alert.title}
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {alert.message}
                            </p>

                          </div>

                        </div>

                      </div>
                    ))}

                  </div>

                </div>
              )}

              {/* Features */}
              {features && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">
                      Model Feature Snapshot
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      The seven features supplied to the trained model.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">

                    <FeatureCard
                      label="Signed Log Z-Score"
                      value={formatScore(features.signed_log_zscore)}
                    />

                    <FeatureCard
                      label="Near ₹5L Split"
                      value={features.flag_near_5L_split}
                      danger={features.flag_near_5L_split === 1}
                    />

                    <FeatureCard
                      label="Log Cost Escalation"
                      value={formatScore(features.log_cost_escalation)}
                    />

                    <FeatureCard
                      label="Ghost Asset"
                      value={features.flag_ghost_asset}
                      danger={features.flag_ghost_asset === 1}
                    />

                    <FeatureCard
                      label="Log Payment Count"
                      value={formatScore(features.log_payment_count)}
                    />

                    <FeatureCard
                      label="Vendor Concentration"
                      value={formatScore(
                        features.vendor_ida_concentration_ratio
                      )}
                    />

                    <FeatureCard
                      label="Negative Timeline"
                      value={features.flag_negative_timeline}
                      danger={features.flag_negative_timeline === 1}
                    />

                  </div>

                </div>
              )}

              {/* Semantic match */}
              {semantic && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Semantic Duplicate Detection
                      </p>

                      <h2 className="mt-2 text-lg font-semibold text-white">
                        {semantic.matched_work_id
                          ? "Similar Existing Work Found"
                          : "No Similar Work Found"}
                      </h2>
                    </div>

                    {semantic.similarity_score != null && (
                      <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 px-4 py-3 text-right">
                        <p className="text-xs text-slate-600">
                          Similarity
                        </p>

                        <p className="mt-1 text-xl font-bold text-blue-400">
                          {(
                            Number(semantic.similarity_score) * 100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    )}

                  </div>

                  {semantic.matched_work_id ? (
                    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-5">

                      <div className="grid gap-4 sm:grid-cols-2">

                        <div>
                          <p className="text-xs text-slate-600">
                            Matched Work ID
                          </p>

                          <p className="mt-1 font-semibold text-white">
                            #{semantic.matched_work_id}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-600">
                            Candidate Works
                          </p>

                          <p className="mt-1 font-semibold text-white">
                            {formatNumber(semantic.candidate_count)}
                          </p>
                        </div>

                      </div>

                      <div className="mt-5">
                        <p className="text-xs text-slate-600">
                          Existing Description
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {semantic.matched_description || "—"}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">

                        {semantic.matched_state && (
                          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
                            {semantic.matched_state}
                          </span>
                        )}

                        {semantic.matched_ida && (
                          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
                            {semantic.matched_ida}
                          </span>
                        )}

                      </div>

                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      No sufficiently similar existing work was found.
                    </p>
                  )}

                </div>
              )}

              {/* Observations */}
              {explanation?.observations?.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

                  <h2 className="text-lg font-semibold text-white">
                    Observations
                  </h2>

                  <div className="mt-4 space-y-3">

                    {explanation.observations.map((item, index) => (
                      <div
                        key={`${item.code}-${index}`}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >

                        <p className="font-medium text-slate-300">
                          {item.title}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {item.message}
                        </p>

                      </div>
                    ))}

                  </div>

                </div>
              )}

            </>
          )}

        </div>

      </div>

    </div>
  );
}

export default LiveEvaluation;