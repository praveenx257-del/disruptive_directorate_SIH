import {
  X,
  AlertTriangle,
  MapPin,
  IndianRupee,
  CalendarDays,
  ImageOff,
  Image,
  ShieldAlert,
  CheckCircle2,
  Building2,
  User,
  FileWarning,
} from "lucide-react";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "₹0";
  }

  const amount = Number(value);

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }

  return `₹${formatNumber(Math.round(amount))}`;
}

function getRiskLevel(score) {
  const value = Number(score ?? 0);

  if (value >= 70) return "high";
  if (value >= 30) return "medium";
  return "low";
}

function getRiskStyles(score) {
  const level = getRiskLevel(score);

  if (level === "high") {
    return {
      text: "text-red-400",
      border: "border-red-500/20",
      background: "bg-red-500/10",
    };
  }

  if (level === "medium") {
    return {
      text: "text-amber-400",
      border: "border-amber-500/20",
      background: "bg-amber-500/10",
    };
  }

  return {
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    background: "bg-emerald-500/10",
  };
}

function parseAlerts(alertReasons) {
  if (!alertReasons || alertReasons === "NORMAL") {
    return [];
  }

  return String(alertReasons)
    .split("|")
    .map((alert) => alert.trim())
    .filter(Boolean);
}

function alertTitle(alert) {
  return alert
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function displayValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    String(value).toLowerCase() === "nan"
  ) {
    return "—";
  }

  return String(value);
}

function WorkDetailDrawer({ work, onClose }) {
  if (!work) return null;

  const riskScore = Number(work.composite_risk_score ?? 0);
  const riskStyles = getRiskStyles(riskScore);

  const alerts = parseAlerts(work.alert_reasons);

  const isAnomaly = Number(work.anomaly_label) === -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div className="min-w-0 pr-4">
            <div className="font-mono text-xs text-slate-600">
              WORK #{work.work_id}
            </div>

            <h2 className="mt-2 text-xl font-bold text-white">
              {displayValue(work.work_description)}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {displayValue(work.category)}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close work details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-500 transition hover:bg-slate-900 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Risk hero */}
          <div
            className={`rounded-2xl border ${riskStyles.border} ${riskStyles.background} p-5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Composite Risk
                </p>

                <p
                  className={`mt-2 text-4xl font-bold ${riskStyles.text}`}
                >
                  {riskScore.toFixed(1)}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border ${riskStyles.border}`}
              >
                {isAnomaly ? (
                  <AlertTriangle
                    size={23}
                    className={riskStyles.text}
                  />
                ) : (
                  <CheckCircle2
                    size={23}
                    className={riskStyles.text}
                  />
                )}
              </div>
            </div>

            <div className="mt-4">
              {isAnomaly ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Isolation Forest Anomaly
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Model Normal
                </span>
              )}
            </div>
          </div>

          {/* Location */}
          <Section title="Location">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox
                icon={<MapPin size={16} />}
                label="State"
                value={work.state}
              />

              <InfoBox
                icon={<MapPin size={16} />}
                label="Constituency"
                value={work.constituency}
              />

              <InfoBox
                icon={<Building2 size={16} />}
                label="IDA"
                value={work.ida}
                fullWidth
              />
            </div>
          </Section>

          {/* Financials */}
          <Section title="Financial Profile">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox
                icon={<IndianRupee size={16} />}
                label="Recommended"
                value={formatCurrency(work.recommended_amount)}
              />

              <InfoBox
                icon={<IndianRupee size={16} />}
                label="Final Amount"
                value={formatCurrency(work.final_amount)}
              />

              <InfoBox
                icon={<IndianRupee size={16} />}
                label="Effective Spent"
                value={formatCurrency(work.effective_spent_amt)}
              />

              <InfoBox
                icon={<ShieldAlert size={16} />}
                label="Financial Risk"
                value={
                  work.financial_risk_score != null
                    ? Number(work.financial_risk_score).toFixed(1)
                    : "—"
                }
              />
            </div>
          </Section>

          {/* Detection signals */}
          <Section title="Detection Signals">
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                <CheckCircle2
                  size={18}
                  className="text-emerald-400"
                />

                <div>
                  <p className="text-sm font-medium text-emerald-400">
                    No alert signals
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    No recorded alert reasons for this work.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div
                    key={`${alert}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-red-500/10 bg-red-500/5 p-4"
                  >
                    <AlertTriangle
                      size={17}
                      className="mt-0.5 shrink-0 text-red-400"
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-300">
                        {alertTitle(alert)}
                      </p>

                      <p className="mt-1 break-words font-mono text-[11px] text-slate-600">
                        {alert}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox
                icon={<CalendarDays size={16} />}
                label="Recommendation Date"
                value={work.recommendation_date}
              />

              <InfoBox
                icon={<CalendarDays size={16} />}
                label="Completed Date"
                value={work.completed_date}
              />

              <InfoBox
                icon={<CalendarDays size={16} />}
                label="Execution Days"
                value={
                  work.execution_days != null
                    ? `${work.execution_days} days`
                    : "—"
                }
              />

              <InfoBox
                icon={
                  work.has_images ? (
                    <Image size={16} />
                  ) : (
                    <ImageOff size={16} />
                  )
                }
                label="Images"
                value={
                  work.has_images === true
                    ? "Available"
                    : work.has_images === false
                      ? "Not available"
                      : "—"
                }
              />
            </div>
          </Section>

          {/* Project details */}
          <Section title="Project Details">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50">
              <DetailRow
                icon={<User size={15} />}
                label="MP"
                value={work.mp_name}
              />

              <DetailRow
                icon={<Building2 size={15} />}
                label="House"
                value={work.house}
              />

              <DetailRow
                icon={<Building2 size={15} />}
                label="Primary Vendor"
                value={work.primary_vendor}
              />

              <DetailRow
                icon={<FileWarning size={15} />}
                label="Identical Works"
                value={
                  work.identical_work_count != null
                    ? formatNumber(work.identical_work_count)
                    : "—"
                }
              />

              <DetailRow
                icon={<FileWarning size={15} />}
                label="Duplicate Work ID"
                value={work.duplicate_of_work_id}
                last
              />
            </div>
          </Section>

          {/* Raw indicators */}
          <Section title="Risk Indicators">
            <div className="grid grid-cols-2 gap-3">
              <Indicator
                label="Near ₹5L Split"
                active={work.flag_near_5L_split === 1}
              />

              <Indicator
                label="Batch Split"
                active={work.flag_batch_split === 1}
              />

              <Indicator
                label="Ghost Asset"
                active={work.flag_ghost_asset === 1}
              />

              <Indicator
                label="Vague Description"
                active={work.flag_vague_desc === 1}
              />

              <Indicator
                label="Negative Timeline"
                active={work.flag_negative_timeline === 1}
              />

              <Indicator
                label="Semantic Duplicate"
                active={work.duplicate_of_work_id != null}
              />
            </div>
          </Section>
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-7">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h3>

      {children}
    </section>
  );
}

function InfoBox({
  icon,
  label,
  value,
  fullWidth = false,
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/50 p-4 ${
        fullWidth ? "col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-slate-600">
        {icon}

        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-slate-200">
        {displayValue(value)}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last = false,
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        !last ? "border-b border-slate-800" : ""
      }`}
    >
      <div className="shrink-0 text-slate-600">
        {icon}
      </div>

      <span className="text-xs text-slate-600">
        {label}
      </span>

      <span className="ml-auto max-w-[55%] truncate text-right text-xs text-slate-300">
        {displayValue(value)}
      </span>
    </div>
  );
}

function Indicator({ label, active }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-3 ${
        active
          ? "border-red-500/15 bg-red-500/5"
          : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <span className="text-xs text-slate-500">
        {label}
      </span>

      {active ? (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Detected
        </span>
      ) : (
        <span className="text-[11px] text-slate-700">
          Clear
        </span>
      )}
    </div>
  );
}

export default WorkDetailDrawer;