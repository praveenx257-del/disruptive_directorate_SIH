import { useState } from "react";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import DistrictRisk from "./pages/DistrictRisk";
import MPScorecards from "./pages/MPScorecards";
import LiveEvaluation from "./pages/LiveEvaluation";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  function renderPage() {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;

      case "Watchlist":
        return <Watchlist />;

      case "District Risk":
        return <DistrictRisk />;

      case "MP Scorecards":
        return <MPScorecards />;

      case "Live Evaluation":
        return <LiveEvaluation />;

      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="ml-64 min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-8 backdrop-blur">

          <div>
            <p className="text-sm font-medium text-slate-300">
              {activePage}
            </p>

            <p className="text-xs text-slate-600">
              JanAudit Intelligence Platform
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <span className="text-xs text-slate-400">
                Live
              </span>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300">
              JA
            </div>

          </div>

        </header>

        {/* Page */}
        <div className="p-8">
          {renderPage()}
        </div>

      </main>

    </div>
  );
}

export default App;