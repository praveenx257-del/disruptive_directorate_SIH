import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatMoney(value) {
  const amount = Number(value || 0);

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }

  return `₹${formatNumber(amount)}`;
}

function StatCard({ label, value, subtitle, type = "normal" }) {
  const styles = {
    normal: {
      border: "border-slate-800",
      icon: "border-blue-900/70 bg-blue-950/30 text-blue-400",
      dot: "bg-blue-400",
    },

    danger: {
      border: "border-red-900/50",
      icon: "border-red-900/70 bg-red-950/30 text-red-400",
      dot: "bg-red-400",
    },

    warning: {
      border: "border-amber-900/50",
      icon: "border-amber-900/70 bg-amber-950/30 text-amber-400",
      dot: "bg-amber-400",
    },

    success: {
      border: "border-emerald-900/50",
      icon: "border-emerald-900/70 bg-emerald-950/30 text-emerald-400",
      dot: "bg-emerald-400",
    },
  };

  const style = styles[type] || styles.normal;

  return (
    <div
      className={`rounded-2xl border ${style.border} bg-slate-900/50 p-5 transition hover:bg-slate-900`}
    >
      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-600">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${style.icon}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
        </div>

      </div>
    </div>
  );
}

function SignalCard({ label, value, description, type = "normal" }) {
  const colors = {
    danger: "text-red-400 border-red-900/40 bg-red-950/10",
    warning: "text-amber-400 border-amber-900/40 bg-amber-950/10",
    normal: "text-blue-400 border-slate-800 bg-slate-950/50",
  };

  return (
    <div
      className={`rounded-xl border p-5 ${colors[type] || colors.normal}`}
    >
      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-slate-400">
          {label}
        </p>

        <p className="text-2xl font-bold text-white">
          {formatNumber(value)}
        </p>

      </div>

      <p className="mt-2 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function RiskBar({ label, value, total, type }) {
  const percentage =
    total > 0 ? Math.max(1, (Number(value) / total) * 100) : 0;

  const barColor = {
    high: "bg-red-500",
    medium: "bg-amber-400",
    low: "bg-emerald-400",
  };

  return (
    <div className="space-y-2">

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {label}
        </span>

        <span className="text-sm font-semibold text-white">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${barColor[type]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

    </div>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [districtData, setDistrictData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [summaryResponse, districtResponse] = await Promise.all([
        fetch(`${API_BASE}/api/summary`),
        fetch(`${API_BASE}/api/district_risk?limit=10`),
      ]);

      if (!summaryResponse.ok) {
        throw new Error("Failed to load national summary.");
      }

      if (!districtResponse.ok) {
        throw new Error("Failed to load district risk data.");
      }

      const summaryJson = await summaryResponse.json();
      const districtJson = await districtResponse.json();

      setSummary(summaryJson);
      setDistrictData(districtJson);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const riskTotal = useMemo(() => {
    if (!summary?.risk_distribution) return 0;

    return (
      Number(summary.risk_distribution.high || 0) +
      Number(summary.risk_distribution.medium || 0) +
      Number(summary.risk_distribution.low || 0)
    );
  }, [summary]);

  const districts = districtData?.districts || [];

  const nationalSignalTotal = useMemo(() => {
    if (!summary?.alerts) return 0;

    return Object.values(summary.alerts).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
  }, [summary]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

          <p className="mt-5 text-sm font-medium text-white">
            Loading national monitoring data...
          </p>

          <p className="mt-2 text-xs text-slate-600">
            Connecting to the JanAudit intelligence backend
          </p>

        </div>

      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="max-w-lg rounded-2xl border border-red-900/50 bg-red-950/20 p-7 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-900 bg-red-950 text-red-400">
            !
          </div>

          <h2 className="mt-4 text-xl font-semibold text-white">
            Dashboard data unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() => loadDashboard()}
            className="mt-5 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-400"
          >
            Retry
          </button>

        </div>

      </div>
    );
  }

  const highRisk = summary?.risk_distribution?.high || 0;
  const mediumRisk = summary?.risk_distribution?.medium || 0;
  const lowRisk = summary?.risk_distribution?.low || 0;

  return (
    <div className="space-y-7">

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section>

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>

            <div className="mb-3 flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-blue-400" />

              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
                National Monitoring
              </span>

            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white">
              Audit Command Center
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              AI-assisted monitoring of MPLADS works, expenditure patterns,
              anomaly signals, and concentrated audit risks.
            </p>

          </div>

          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <span className={refreshing ? "animate-spin" : ""}>
              ↻
            </span>

            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>

        </div>

      </section>

      {/* ========================================================= */}
      {/* TOP METRICS */}
      {/* ========================================================= */}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Total Works"
          value={formatNumber(summary?.total_works)}
          subtitle="Works in scored dataset"
          type="normal"
        />

        <StatCard
          label="Anomalous Works"
          value={formatNumber(summary?.anomalous_works)}
          subtitle="Flagged by Isolation Forest"
          type="danger"
        />

        <StatCard
          label="High Risk Works"
          value={formatNumber(highRisk)}
          subtitle="Composite risk classification"
          type="warning"
        />

        <StatCard
          label="Average Risk"
          value={Number(summary?.average_composite_risk || 0).toFixed(2)}
          subtitle="Average composite risk score"
          type="success"
        />

      </section>

      {/* ========================================================= */}
      {/* RISK + SIGNALS */}
      {/* ========================================================= */}

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">

        {/* Risk distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-lg font-semibold text-white">
                Risk Distribution
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Composite risk classification across monitored works.
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-900/60 bg-amber-950/20 text-amber-400">
              !
            </div>

          </div>

          <div className="mt-8 space-y-7">

            <RiskBar
              label="High Risk"
              value={highRisk}
              total={riskTotal}
              type="high"
            />

            <RiskBar
              label="Medium Risk"
              value={mediumRisk}
              total={riskTotal}
              type="medium"
            />

            <RiskBar
              label="Low Risk"
              value={lowRisk}
              total={riskTotal}
              type="low"
            />

          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-800 pt-5">

            <div>
              <p className="text-xs text-slate-600">
                High
              </p>

              <p className="mt-1 text-lg font-semibold text-red-400">
                {riskTotal
                  ? ((highRisk / riskTotal) * 100).toFixed(1)
                  : "0.0"}
                %
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-600">
                Medium
              </p>

              <p className="mt-1 text-lg font-semibold text-amber-400">
                {riskTotal
                  ? ((mediumRisk / riskTotal) * 100).toFixed(1)
                  : "0.0"}
                %
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-600">
                Low
              </p>

              <p className="mt-1 text-lg font-semibold text-emerald-400">
                {riskTotal
                  ? ((lowRisk / riskTotal) * 100).toFixed(1)
                  : "0.0"}
                %
              </p>
            </div>

          </div>

        </div>

        {/* Detection signals */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-lg font-semibold text-white">
                Detection Signals
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Recorded alert indicators across the scored dataset.
              </p>

            </div>

            <div className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-500">
              {formatNumber(nationalSignalTotal)} signals
            </div>

          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">

            <SignalCard
              label="Batch Split"
              value={summary?.alerts?.batch_split}
              description="Repeated or clustered works detected."
              type="warning"
            />

            <SignalCard
              label="Vague Description"
              value={summary?.alerts?.vague_description}
              description="Works with insufficiently specific descriptions."
              type="normal"
            />

            <SignalCard
              label="Ghost Asset"
              value={summary?.alerts?.ghost_asset}
              description="Fully disbursed works without images."
              type="danger"
            />

            <SignalCard
              label="Near ₹5L"
              value={summary?.alerts?.near_5l_threshold}
              description="Works close to the ₹5 lakh threshold."
              type="warning"
            />

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* HIGH RISK SNAPSHOT */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50">

        <div className="flex flex-col justify-between gap-3 border-b border-slate-800 p-6 sm:flex-row sm:items-center">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="text-lg font-semibold text-white">
                District Risk Snapshot
              </h2>

              <span className="rounded-full border border-red-900/50 bg-red-950/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                AI Signals
              </span>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Districts with concentrated anomaly and risk indicators.
            </p>

          </div>

          <p className="text-xs text-slate-600">
            Top {districts.length} displayed
          </p>

        </div>

        {districts.length > 0 ? (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead>

                <tr className="border-b border-slate-800 text-left">

                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    District / IDA
                  </th>

                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Works
                  </th>

                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Anomalies
                  </th>

                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    High Risk
                  </th>

                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Avg Risk
                  </th>

                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Expenditure
                  </th>

                </tr>

              </thead>

              <tbody>

                {districts.map((district, index) => {

                  const risk = Number(district.average_risk || 0);

                  return (
                    <tr
                      key={`${district.district}-${index}`}
                      className="border-b border-slate-800/70 transition hover:bg-slate-950/70"
                    >

                      <td className="px-6 py-5">

                        <p className="max-w-[360px] truncate text-sm font-semibold text-white">
                          {district.district}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          {district.state}
                        </p>

                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {formatNumber(district.total_works)}
                      </td>

                      <td className="px-6 py-5">

                        <span className="rounded-full border border-red-900/50 bg-red-950/20 px-2.5 py-1 text-xs font-semibold text-red-400">
                          {formatNumber(district.anomalous_works)}
                        </span>

                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-amber-400">
                        {formatNumber(district.high_risk_works)}
                      </td>

                      <td className="px-6 py-5">

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            risk >= 50
                              ? "border-red-900/50 bg-red-950/20 text-red-400"
                              : risk >= 25
                              ? "border-amber-900/50 bg-amber-950/20 text-amber-400"
                              : "border-emerald-900/50 bg-emerald-950/20 text-emerald-400"
                          }`}
                        >
                          {risk.toFixed(1)}
                        </span>

                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {formatMoney(district.total_expenditure)}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-600">
            No district risk data available.
          </div>
        )}

      </section>

      {/* ========================================================= */}
      {/* SYSTEM STATUS */}
      {/* ========================================================= */}

      <section className="grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">

          <div className="flex items-center gap-3">

            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <p className="text-sm font-medium text-white">
              Scored Dataset
            </p>

          </div>

          <p className="mt-2 text-xs text-slate-600">
            {formatNumber(summary?.total_works)} works loaded into memory.
          </p>

        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">

          <div className="flex items-center gap-3">

            <span className="h-2 w-2 rounded-full bg-blue-400" />

            <p className="text-sm font-medium text-white">
              Isolation Forest
            </p>

          </div>

          <p className="mt-2 text-xs text-slate-600">
            Trained anomaly model available for live evaluation.
          </p>

        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">

          <div className="flex items-center gap-3">

            <span className="h-2 w-2 rounded-full bg-violet-400" />

            <p className="text-sm font-medium text-white">
              Semantic Detection
            </p>

          </div>

          <p className="mt-2 text-xs text-slate-600">
            Existing work descriptions available for similarity analysis.
          </p>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;