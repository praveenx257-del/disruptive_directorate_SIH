import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function formatMoney(value) {
  const amount = Number(value || 0);

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>

      {subtext && (
        <p className="mt-2 text-sm text-slate-500">
          {subtext}
        </p>
      )}
    </div>
  );
}

function MPScorecards() {
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All states");
  const [limit, setLimit] = useState(20);

  const [selectedMP, setSelectedMP] = useState(null);

  async function fetchScorecards() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/mp_scorecards?limit=774`
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      /*
       * The backend may return the array under different keys.
       * Support the normal scorecards response structure.
       */
      const rows =
        data.scorecards ||
        data.mp_scorecards ||
        data.results ||
        data.data ||
        [];

      if (!Array.isArray(rows)) {
        throw new Error("Invalid MP scorecard response from API");
      }

      setScorecards(rows);
    } catch (err) {
      console.error("MP Scorecards error:", err);
      setError(err.message || "Failed to load MP scorecards");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScorecards();
  }, []);

  const states = useMemo(() => {
    const uniqueStates = [
      ...new Set(
        scorecards
          .map((mp) => mp.state)
          .filter(Boolean)
      ),
    ];

    return uniqueStates.sort();
  }, [scorecards]);

  const filteredScorecards = useMemo(() => {
    const query = search.trim().toLowerCase();

    return scorecards
      .filter((mp) => {
        if (stateFilter !== "All states") {
          if (mp.state !== stateFilter) {
            return false;
          }
        }

        if (!query) {
          return true;
        }

        return (
          String(mp.mp_name || "")
            .toLowerCase()
            .includes(query) ||
          String(mp.constituency || "")
            .toLowerCase()
            .includes(query) ||
          String(mp.state || "")
            .toLowerCase()
            .includes(query)
        );
      })
      .slice(0, limit);
  }, [scorecards, search, stateFilter, limit]);

  const statistics = useMemo(() => {
    const rows = scorecards;

    const totalAllocated = rows.reduce(
      (sum, mp) => sum + Number(mp.allocated_amount || 0),
      0
    );

    const totalRecommended = rows.reduce(
      (sum, mp) => sum + Number(mp.amount_recommended || 0),
      0
    );

    const totalExpenditure = rows.reduce(
      (sum, mp) => sum + Number(mp.total_expenditure || 0),
      0
    );

    const totalCompleted = rows.reduce(
      (sum, mp) => sum + Number(mp.completed_works || 0),
      0
    );

    return {
      totalMPs: rows.length,
      totalAllocated,
      totalRecommended,
      totalExpenditure,
      totalCompleted,
    };
  }, [scorecards]);

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400" />

            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
              Parliamentary Intelligence
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white">
            MP Scorecards
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Compare MPLADS utilization, expenditure, completion,
            and payment activity across MPs.
          </p>
        </div>

        <button
          onClick={fetchScorecards}
          className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
        >
          ↻ Refresh
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-5">
          <p className="font-semibold text-red-400">
            Failed to load MP Scorecards
          </p>

          <p className="mt-1 text-sm text-red-300/70">
            {error}
          </p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="MPs Covered"
          value={formatNumber(statistics.totalMPs)}
          subtext="Available scorecards"
        />

        <StatCard
          label="Allocated Amount"
          value={formatMoney(statistics.totalAllocated)}
          subtext="Across returned MPs"
        />

        <StatCard
          label="Total Expenditure"
          value={formatMoney(statistics.totalExpenditure)}
          subtext="Recorded expenditure"
        />

        <StatCard
          label="Completed Works"
          value={formatNumber(statistics.totalCompleted)}
          subtext="Completed projects"
        />

      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">

        <div className="grid gap-3 lg:grid-cols-[1fr_220px_150px]">

          {/* Search */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 px-4">
            <span className="mr-3 text-slate-600">
              ⌕
            </span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search MP, constituency or state..."
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
            />
          </div>

          {/* State */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none"
          >
            <option>All states</option>

            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          {/* Results */}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none"
          >
            <option value={20}>20 results</option>
            <option value={50}>50 results</option>
            <option value={100}>100 results</option>
            <option value={200}>200 results</option>
            <option value={774}>All results</option>
          </select>

        </div>

      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">

        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Parliamentary Scorecards
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredScorecards.length.toLocaleString("en-IN")} MPs displayed
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            API Connected
          </div>

        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

              <p className="mt-4 text-sm text-slate-500">
                Loading MP scorecards...
              </p>
            </div>
          </div>
        ) : filteredScorecards.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold text-white">
                No scorecards found
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or state filter.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead>
                <tr className="border-b border-slate-800 text-left">

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    MP
                  </th>

                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Location
                  </th>

                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Allocated
                  </th>

                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Expenditure
                  </th>

                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Utilization
                  </th>

                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Works
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Completion
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredScorecards.map((mp, index) => {

                  const utilization = Number(
                    mp.utilization_percent || 0
                  );

                  const completion = Number(
                    mp.completion_rate_percent || 0
                  );

                  return (
                    <tr
                      key={`${mp.mp_name}-${mp.constituency}-${index}`}
                      onClick={() => setSelectedMP(mp)}
                      className="cursor-pointer border-b border-slate-800/70 transition hover:bg-slate-800/30"
                    >

                      {/* MP */}
                      <td className="px-6 py-5">

                        <p className="max-w-[260px] font-semibold text-white">
                          {mp.mp_name || "Unknown MP"}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          {mp.house || "—"}
                        </p>

                      </td>

                      {/* Location */}
                      <td className="px-4 py-5">

                        <p className="text-sm font-medium text-slate-300">
                          {mp.constituency || "—"}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          {mp.state || "—"}
                        </p>

                      </td>

                      {/* Allocated */}
                      <td className="px-4 py-5 text-sm font-semibold text-slate-300">
                        {formatMoney(mp.allocated_amount)}
                      </td>

                      {/* Expenditure */}
                      <td className="px-4 py-5">

                        <p className="text-sm font-semibold text-slate-300">
                          {formatMoney(mp.total_expenditure)}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Recommended:{" "}
                          {formatMoney(mp.amount_recommended)}
                        </p>

                      </td>

                      {/* Utilization */}
                      <td className="px-4 py-5">

                        <div className="w-32">

                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">
                              {utilization.toFixed(1)}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-blue-400"
                              style={{
                                width: `${Math.min(
                                  Math.max(utilization, 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                        </div>

                      </td>

                      {/* Works */}
                      <td className="px-4 py-5">

                        <p className="text-sm font-semibold text-white">
                          {formatNumber(mp.completed_works)}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          of {formatNumber(mp.recommended_works)}
                        </p>

                      </td>

                      {/* Completion */}
                      <td className="px-6 py-5">

                        <div className="w-32">

                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">
                              {completion.toFixed(1)}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{
                                width: `${Math.min(
                                  Math.max(completion, 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* MP Detail Drawer */}
      {selectedMP && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedMP(null)}
        >

          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Drawer header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-6">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                  MP Scorecard
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  {selectedMP.mp_name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedMP.constituency} · {selectedMP.state}
                </p>

              </div>

              <button
                onClick={() => setSelectedMP(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white"
              >
                ×
              </button>

            </div>

            {/* Overview */}
            <div className="mt-7">

              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Financial Profile
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3">

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-600">
                    Allocated
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {formatMoney(selectedMP.allocated_amount)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-600">
                    Recommended
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {formatMoney(selectedMP.amount_recommended)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-600">
                    Expenditure
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {formatMoney(selectedMP.total_expenditure)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-600">
                    Vendor Balance
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {formatMoney(selectedMP.balance_not_paid_to_vendors)}
                  </p>
                </div>

              </div>

            </div>

            {/* Work profile */}
            <div className="mt-7">

              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Work Profile
              </h3>

              <div className="mt-4 space-y-3">

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <span className="text-sm text-slate-500">
                    Completed works
                  </span>

                  <span className="font-semibold text-white">
                    {formatNumber(selectedMP.completed_works)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <span className="text-sm text-slate-500">
                    Recommended works
                  </span>

                  <span className="font-semibold text-white">
                    {formatNumber(selectedMP.recommended_works)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <span className="text-sm text-slate-500">
                    Completion rate
                  </span>

                  <span className="font-semibold text-white">
                    {Number(
                      selectedMP.completion_rate_percent || 0
                    ).toFixed(2)}
                    %
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <span className="text-sm text-slate-500">
                    Utilization
                  </span>

                  <span className="font-semibold text-white">
                    {Number(
                      selectedMP.utilization_percent || 0
                    ).toFixed(2)}
                    %
                  </span>
                </div>

              </div>

            </div>

            {/* Payments */}
            <div className="mt-7">

              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Payment Activity
              </h3>

              <div className="mt-4 grid grid-cols-3 gap-3">

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-600">
                    Transactions
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {formatNumber(selectedMP.transaction_count)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-600">
                    Successful
                  </p>

                  <p className="mt-2 text-xl font-bold text-emerald-400">
                    {formatNumber(selectedMP.successful_payments)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-600">
                    Pending
                  </p>

                  <p className="mt-2 text-xl font-bold text-amber-400">
                    {formatNumber(selectedMP.pending_payments)}
                  </p>
                </div>

              </div>

            </div>

            {/* Rating */}
            <div className="mt-7">

              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Average Rating
              </h3>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-5">

                <span className="text-3xl font-bold text-white">
                  {selectedMP.average_rating == null
                    ? "—"
                    : Number(selectedMP.average_rating).toFixed(2)}
                </span>

                <span className="ml-2 text-sm text-slate-600">
                  / 5
                </span>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default MPScorecards;