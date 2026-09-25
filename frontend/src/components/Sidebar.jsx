import {
  LayoutDashboard,
  ShieldAlert,
  Map,
  Users,
  ScanSearch,
  Activity,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Watchlist",
    icon: ShieldAlert,
  },
  {
    label: "District Risk",
    icon: Map,
  },
  {
    label: "MP Scorecards",
    icon: Users,
  },
  {
    label: "Live Evaluation",
    icon: ScanSearch,
  },
];

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-950">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Jan<span className="text-blue-400">Audit</span>
          </h1>

          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
            MPLADS AI Watchdog
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Monitoring
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.label;

          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.label)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon size={18} />

              <span>{item.label}</span>

              {item.label === "Watchlist" && (
                <span className="ml-auto rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Backend status */}
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />

            <span className="text-xs font-medium text-emerald-400">
              API Connected
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
            <Activity size={12} />
            FastAPI backend
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;