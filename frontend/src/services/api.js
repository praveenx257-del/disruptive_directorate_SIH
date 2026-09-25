const API_BASE_URL = "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `API request failed (${response.status}): ${message}`
    );
  }

  return response.json();
}

export async function getSummary() {
  return request("/api/summary");
}

export async function getWatchlist({
  limit = 20,
  minRisk = 0,
  state = null,
  anomalyOnly = false,
} = {}) {
  const params = new URLSearchParams();

  params.set("limit", limit);
  params.set("min_risk", minRisk);
  params.set("anomaly_only", anomalyOnly);

  if (state) {
    params.set("state", state);
  }

  return request(`/api/watchlist?${params.toString()}`);
}

export async function getDistrictRisk({
  limit = 50,
  state = null,
} = {}) {
  const params = new URLSearchParams();

  params.set("limit", limit);

  if (state) {
    params.set("state", state);
  }

  return request(`/api/district_risk?${params.toString()}`);
}

export async function getMPScorecards({
  limit = 20,
  state = null,
} = {}) {
  const params = new URLSearchParams();

  params.set("limit", limit);

  if (state) {
    params.set("state", state);
  }

  return request(`/api/mp_scorecards?${params.toString()}`);
}

export async function evaluateLiveProposal(proposal) {
  return request("/api/evaluate_live", {
    method: "POST",
    body: JSON.stringify(proposal),
  });
}

export async function checkHealth() {
  return request("/api/health");
}