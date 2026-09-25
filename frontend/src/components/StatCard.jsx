function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = "blue",
}) {
  const accentStyles = {
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-400",
    red: "border-red-500/20 bg-red-500/5 text-red-400",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accentStyles[accent]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;