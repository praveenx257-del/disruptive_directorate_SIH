import { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { getWatchlist } from "../services/api";
import WorkDetailDrawer from "../components/WorkDetailDrawer";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

function formatCurrency(value) {
  if (value == null) return "₹0";

  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }

  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }

  return `₹${formatNumber(Math.round(value))}`;
}

function getRiskLevel(score) {
  if (score >= 70) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function RiskBadge({ score }) {
  const level = getRiskLevel(score);

  const styles = {
    high: "border-red-500/20 bg-red-500/10 text-red-400",
    medium: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[level]}`}
    >
      {Number(score ?? 0).toFixed(1)}
    </span>
  );
}

function Watchlist() {
  const [selectedWork, setSelectedWork] = useState(null);

  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [minRisk, setMinRisk] = useState(0);
  const [state, setState] = useState("");
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [limit, setLimit] = useState(20);

  const [totalMatches, setTotalMatches] = useState(0);

  async function loadWatchlist() {
    setLoading(true);
    setError(null);

    try {
      const data = await getWatchlist({
        limit,
        minRisk,
        state: state || null,
        anomalyOnly,
      });

      setWorks(data.works ?? []);
      setTotalMatches(data.total_matches ?? 0);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, [limit, minRisk, state, anomalyOnly]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-red-400">
          <AlertTriangle size={13} />
          Risk intelligence
        </div>

        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
          AI Watchlist
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Review works ranked by their composite risk indicators.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <SlidersHorizontal size={16} className="text-blue-400" />
          Filters
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {/* Minimum risk */}
          <div>
            <label className="mb-2 block text-xs text-slate-500">
              Minimum risk
            </label>

            <input
              type="number"
              min="0"
              max="100"
              value={minRisk}
              onChange={(e) => setMinRisk(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          {/* State */}
          <div>
            <label className="mb-2 block text-xs text-slate-500">
              State
            </label>

            <input
              type="text"
              placeholder="e.g. Uttar Pradesh"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-700 outline-none transition focus:border-blue-500/50"
            />
          </div>

          {/* Result count */}
          <div>
            <label className="mb-2 block text-xs text-slate-500">
              Results
            </label>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Anomaly */}
          <div className="flex items-end">
            <button
              onClick={() => setAnomalyOnly(!anomalyOnly)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                anomalyOnly
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
              <AlertTriangle size={15} />
              Anomalies only
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
        {/* Table header */}
        <div className="flex flex-col gap-3 border-b border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-white">
              Flagged Works
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {formatNumber(totalMatches)} works match the current filters
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Search size={14} />
            Showing {works.length} results
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

              <p className="mt-3 text-xs text-slate-500">
                Loading watchlist...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
              {error}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && works.length === 0 && (
          <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
            No works match the current filters.
          </div>
        )}

        {/* Table */}
        {!loading && !error && works.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-600">
                  <th className="px-6 py-4">Work</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Recommended</th>
                  <th className="px-4 py-4">Risk</th>
                  <th className="px-4 py-4">Model</th>
                  <th className="px-6 py-4">Alerts</th>
                </tr>
              </thead>

              <tbody>
                {works.map((work) => (
                  <tr
                    key={work.work_id}
                    onClick={() => setSelectedWork(work)}
                    className="cursor-pointer border-b border-slate-800/70 transition hover:bg-slate-800/30"
                  >
                    {/* Work */}
                    <td className="max-w-[330px] px-6 py-5">
                      <div className="text-xs font-mono text-slate-600">
                        #{work.work_id}
                      </div>

                      <div className="mt-1 truncate text-sm font-medium text-white">
                        {work.work_description || "No description"}
                      </div>

                      <div className="mt-1 text-xs text-slate-600">
                        {work.category}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-5">
                      <div className="text-sm text-slate-300">
                        {work.state}
                      </div>

                      <div className="mt-1 max-w-[180px] truncate text-xs text-slate-600">
                        {work.constituency}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-5">
                      <div className="text-sm font-medium text-slate-200">
                        {formatCurrency(work.recommended_amount)}
                      </div>

                      <div className="mt-1 text-xs text-slate-600">
                        Final: {formatCurrency(work.final_amount)}
                      </div>
                    </td>

                    {/* Risk */}
                    <td className="px-4 py-5">
                      <RiskBadge score={work.composite_risk_score} />
                    </td>

                    {/* Model */}
                    <td className="px-4 py-5">
                      {work.anomaly_label === -1 ? (
                        <span className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-400">
                          Anomaly
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Alerts */}
                    <td className="max-w-[300px] px-6 py-5">
                      <p className="text-xs leading-5 text-slate-400">
                        {work.alert_reasons || "NORMAL"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && !error && works.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
            <p className="text-xs text-slate-600">
              Showing {works.length} of {formatNumber(totalMatches)} matching
              works
            </p>

            <div className="flex gap-2">
              <button
                disabled
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-700"
              >
                <ChevronLeft size={15} />
              </button>

              <button
                disabled
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-700"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Work investigation drawer */}
      {selectedWork && (
        <WorkDetailDrawer
          work={selectedWork}
          onClose={() => setSelectedWork(null)}
        />
      )}
    </div>
  );
}

export default Watchlist;