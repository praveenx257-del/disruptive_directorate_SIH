import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Map,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value ?? 0));
}

function formatCurrency(value) {
  const amount = Number(value ?? 0);

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }

  return `₹${formatNumber(Math.round(amount))}`;
}

function getRiskStyles(score) {
  const value = Number(score ?? 0);

  if (value >= 50) {
    return {
      badge: "border-red-500/20 bg-red-500/10 text-red-400",
      text: "text-red-400",
    };
  }

  if (value >= 20) {
    return {
      badge: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      text: "text-amber-400",
    };
  }

  return {
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    text: "text-emerald-400",
  };
}

function RiskBadge({ score }) {
  const styles = getRiskStyles(score);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}
    >
      {Number(score ?? 0).toFixed(1)}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accent = "blue",
}) {
  const accents = {
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-400",
    red: "border-red-500/20 bg-red-500/5 text-red-400",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b1224] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accents[accent]}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function AlertMini({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#080f20] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500">
          <Icon size={15} />
          <span className="text-xs">{label}</span>
        </div>

        <span className="text-lg font-semibold text-white">
          {formatNumber(value)}
        </span>
      </div>
    </div>
  );
}

function DistrictDrawer({ district, onClose }) {
  if (!district) {
    return null;
  }

  const riskStyles = getRiskStyles(district.average_risk);

  const recommended = Number(
    district.total_recommended_amount ?? 0
  );

  const expenditure = Number(
    district.total_expenditure ?? 0
  );

  const expenditurePercent =
    recommended > 0
      ? Math.min(100, (expenditure / recommended) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-[#050a18] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-800 bg-[#050a18]/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
                District / IDA
              </p>

              <h2 className="mt-2 pr-6 text-xl font-bold text-white">
                {district.district || "Unknown District"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {district.state || "Unknown State"}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#0b1224] text-slate-400 transition hover:border-slate-700 hover:text-white"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Risk overview */}
          <div className="rounded-2xl border border-slate-800 bg-[#0b1224] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Average Risk
                </p>

                <p
                  className={`mt-2 text-4xl font-bold ${riskStyles.text}`}
                >
                  {Number(
                    district.average_risk ?? 0
                  ).toFixed(1)}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Maximum observed risk:{" "}
                  <span className="text-slate-300">
                    {Number(
                      district.maximum_risk ?? 0
                    ).toFixed(1)}
                  </span>
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-[#080f20]">
                <ShieldAlert
                  className={riskStyles.text}
                  size={26}
                />
              </div>
            </div>
          </div>

          {/* Activity profile */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Activity Profile
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-[#0b1224] p-4">
                <p className="text-xs text-slate-500">
                  Total Works
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {formatNumber(district.total_works)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0b1224] p-4">
                <p className="text-xs text-slate-500">
                  Constituencies
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {formatNumber(
                    district.constituency_count
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                <p className="text-xs text-slate-500">
                  Anomalous Works
                </p>

                <p className="mt-2 text-xl font-semibold text-red-400">
                  {formatNumber(
                    district.anomalous_works
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                <p className="text-xs text-slate-500">
                  High Risk Works
                </p>

                <p className="mt-2 text-xl font-semibold text-red-400">
                  {formatNumber(
                    district.high_risk_works
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                <p className="text-xs text-slate-500">
                  Medium Risk Works
                </p>

                <p className="mt-2 text-xl font-semibold text-amber-400">
                  {formatNumber(
                    district.medium_risk_works
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0b1224] p-4">
                <p className="text-xs text-slate-500">
                  Recommended Amount
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {formatCurrency(
                    district.total_recommended_amount
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Financial profile */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Financial Profile
            </p>

            <div className="rounded-2xl border border-slate-800 bg-[#0b1224] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Total Expenditure
                  </p>

                  <p className="mt-2 text-2xl font-bold text-white">
                    {formatCurrency(
                      district.total_expenditure
                    )}
                  </p>
                </div>

                <Wallet
                  className="text-blue-400"
                  size={24}
                />
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${expenditurePercent}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Expenditure / Recommended</span>

                <span>
                  {recommended > 0
                    ? (
                        (expenditure / recommended) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Detection signals */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Detection Signals
            </p>

            <div className="grid grid-cols-2 gap-3">
              <AlertMini
                label="Ghost Assets"
                value={district.alerts?.ghost_asset}
                icon={ShieldAlert}
              />

              <AlertMini
                label="Batch Splits"
                value={district.alerts?.batch_split}
                icon={TrendingUp}
              />

              <AlertMini
                label="Near ₹5L"
                value={
                  district.alerts?.near_5l_threshold
                }
                icon={Wallet}
              />

              <AlertMini
                label="Negative Timeline"
                value={
                  district.alerts?.negative_timeline
                }
                icon={AlertTriangle}
              />

              <AlertMini
                label="Vague Description"
                value={
                  district.alerts?.vague_description
                }
                icon={Search}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistrictRisk() {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [state, setState] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);

  const [selectedDistrict, setSelectedDistrict] =
    useState(null);

  async function loadDistrictRisk() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      params.set("limit", String(limit));

      if (state) {
        params.set("state", state);
      }

      const response = await fetch(
        `${API_BASE}/api/district_risk?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status}`
        );
      }

      const data = await response.json();

      setDistricts(data.districts ?? []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load district risk data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDistrictRisk();
  }, [state, limit]);

  const states = useMemo(() => {
    return [
      ...new Set(
        districts
          .map((item) => item.state)
          .filter(Boolean)
      ),
    ].sort();
  }, [districts]);

  const filteredDistricts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return districts;
    }

    return districts.filter((district) => {
      return (
        String(district.district ?? "")
          .toLowerCase()
          .includes(query) ||
        String(district.state ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [districts, search]);

  const totals = useMemo(() => {
    return {
      districts: districts.length,

      works: districts.reduce(
        (sum, item) =>
          sum + Number(item.total_works ?? 0),
        0
      ),

      anomalies: districts.reduce(
        (sum, item) =>
          sum + Number(item.anomalous_works ?? 0),
        0
      ),

      highRisk: districts.reduce(
        (sum, item) =>
          sum + Number(item.high_risk_works ?? 0),
        0
      ),
    };
  }, [districts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
            <Map size={13} />
            Geographic intelligence
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            District Risk
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Compare risk patterns across Implementing
            District Authorities and identify areas with
            concentrated audit signals.
          </p>
        </div>

        <button
          onClick={loadDistrictRisk}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#0b1224] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Districts / IDAs"
          value={formatNumber(totals.districts)}
          subtitle="Returned by current filter"
          accent="blue"
        />

        <StatCard
          icon={Map}
          label="Works Covered"
          value={formatNumber(totals.works)}
          subtitle="Across displayed districts"
          accent="blue"
        />

        <StatCard
          icon={AlertTriangle}
          label="Anomalous Works"
          value={formatNumber(totals.anomalies)}
          subtitle="Isolation Forest flagged"
          accent="red"
        />

        <StatCard
          icon={ShieldAlert}
          label="High Risk Works"
          value={formatNumber(totals.highRisk)}
          subtitle="Composite risk ≥ 50"
          accent="amber"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800 bg-[#0b1224] p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px_140px]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search district or state..."
              className="w-full rounded-xl border border-slate-800 bg-[#070d1c] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50"
            />
          </div>

          <div className="relative">
            <select
              value={state}
              onChange={(event) =>
                setState(event.target.value)
              }
              className="w-full appearance-none rounded-xl border border-slate-800 bg-[#070d1c] px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
            >
              <option value="">All states</option>

              {states.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-600"
            />
          </div>

          <select
            value={limit}
            onChange={(event) =>
              setLimit(Number(event.target.value))
            }
            className="rounded-xl border border-slate-800 bg-[#070d1c] px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value={20}>20 results</option>
            <option value={50}>50 results</option>
            <option value={100}>100 results</option>
            <option value={200}>200 results</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 text-red-400"
              size={18}
            />

            <div>
              <p className="font-medium text-red-400">
                Unable to load district data
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1224]">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              District Risk Ranking
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Loading district intelligence..."
                : `${formatNumber(
                    filteredDistricts.length
                  )} districts displayed`}
            </p>
          </div>

          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Higher risk
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-slate-900/70"
              />
            ))}
          </div>
        ) : filteredDistricts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Map
              className="mx-auto text-slate-700"
              size={32}
            />

            <p className="mt-4 font-medium text-slate-300">
              No districts found
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Try changing your search or state filter.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-[0.14em] text-slate-600">
                    <th className="px-6 py-4 font-medium">
                      District / IDA
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Works
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Anomalies
                    </th>

                    <th className="px-4 py-4 font-medium">
                      High Risk
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Avg Risk
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Expenditure
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Signals
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDistricts.map(
                    (district, index) => (
                      <tr
                        key={`${district.state}-${district.district}-${index}`}
                        onClick={() =>
                          setSelectedDistrict(district)
                        }
                        className="cursor-pointer border-b border-slate-800/70 transition hover:bg-slate-900/40"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-[#080f20]">
                              <Building2
                                size={16}
                                className="text-blue-400"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[330px] truncate text-sm font-semibold text-white">
                                {district.district ||
                                  "Unknown"}
                              </p>

                              <p className="mt-1 text-xs text-slate-600">
                                {district.state ||
                                  "Unknown state"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <span className="text-sm font-medium text-slate-300">
                            {formatNumber(
                              district.total_works
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <span className="text-sm font-medium text-red-400">
                            {formatNumber(
                              district.anomalous_works
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <span className="text-sm font-medium text-red-400">
                            {formatNumber(
                              district.high_risk_works
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <RiskBadge
                            score={
                              district.average_risk
                            }
                          />
                        </td>

                        <td className="px-4 py-5">
                          <span className="text-sm font-medium text-slate-300">
                            {formatCurrency(
                              district.total_expenditure
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            {Number(
                              district.alerts
                                ?.ghost_asset ?? 0
                            ) > 0 && (
                              <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400">
                                GHOST
                              </span>
                            )}

                            {Number(
                              district.alerts
                                ?.batch_split ?? 0
                            ) > 0 && (
                              <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-400">
                                SPLIT
                              </span>
                            )}

                            {Number(
                              district.alerts
                                ?.near_5l_threshold ?? 0
                            ) > 0 && (
                              <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-400">
                                ₹5L
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
              {filteredDistricts.map(
                (district, index) => (
                  <button
                    key={`${district.state}-${district.district}-${index}`}
                    onClick={() =>
                      setSelectedDistrict(district)
                    }
                    className="w-full rounded-xl border border-slate-800 bg-[#080f20] p-4 text-left transition hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {district.district}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          {district.state}
                        </p>
                      </div>

                      <RiskBadge
                        score={
                          district.average_risk
                        }
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] uppercase text-slate-600">
                          Works
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {formatNumber(
                            district.total_works
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-slate-600">
                          Anomalies
                        </p>

                        <p className="mt-1 text-sm text-red-400">
                          {formatNumber(
                            district.anomalous_works
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-slate-600">
                          High Risk
                        </p>

                        <p className="mt-1 text-sm text-red-400">
                          {formatNumber(
                            district.high_risk_works
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>

      <DistrictDrawer
        district={selectedDistrict}
        onClose={() => setSelectedDistrict(null)}
      />
    </div>
  );
}

export default DistrictRisk;