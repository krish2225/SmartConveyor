/**
 * SmartConveyor - Centralized MongoDB REST API Client
 * Connects frontend to Express backend endpoints (/api/*)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthToken() {
  try {
    return localStorage.getItem('smartconveyor_token') || null;
  } catch {
    return null;
  }
}

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `API Error: ${res.status} ${res.statusText}`);
    }
    return data;
  } catch (err) {
    // If backend isn't reachable, pass through helpful error info
    console.warn(`[API Client] Error on ${endpoint}:`, err.message);
    throw err;
  }
}

// --- Authentication APIs ---
export async function loginUserApi(email, password, role) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role })
  });
  if (data.token) {
    localStorage.setItem('smartconveyor_token', data.token);
    localStorage.setItem('smartconveyor_user', JSON.stringify(data.user));
  }
  return data;
}

export async function registerUserApi(userData) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  if (data.token) {
    localStorage.setItem('smartconveyor_token', data.token);
    localStorage.setItem('smartconveyor_user', JSON.stringify(data.user));
  }
  return data;
}

export async function getMeApi() {
  return apiFetch('/auth/me');
}

// --- MongoDB Logs APIs ---
export async function getLogsApi(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, v);
    }
  });
  const qs = query.toString();
  return apiFetch(`/logs${qs ? `?${qs}` : ''}`);
}

export async function createLogApi(logData) {
  return apiFetch('/logs', {
    method: 'POST',
    body: JSON.stringify(logData)
  });
}

export async function getLogStatsApi(facilityId) {
  return apiFetch(`/logs/stats${facilityId ? `?facilityId=${facilityId}` : ''}`);
}

export async function clearLogsApi(data) {
  return apiFetch('/logs/clear', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// --- MongoDB Alerts APIs ---
export async function getAlertsApi(facilityId, status, severity) {
  const query = new URLSearchParams();
  if (facilityId) query.append('facilityId', facilityId);
  if (status) query.append('status', status);
  if (severity) query.append('severity', severity);
  const qs = query.toString();
  return apiFetch(`/alerts${qs ? `?${qs}` : ''}`);
}

export async function createAlertApi(alertData) {
  return apiFetch('/alerts', {
    method: 'POST',
    body: JSON.stringify(alertData)
  });
}

export async function acknowledgeAlertApi(alertId, user, remark) {
  return apiFetch(`/alerts/${alertId}/acknowledge`, {
    method: 'PATCH',
    body: JSON.stringify({ user, remark })
  });
}

export async function resolveAlertApi(alertId, user, resolutionNote) {
  return apiFetch(`/alerts/${alertId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ user, resolutionNote })
  });
}

// --- MongoDB Splice Joint APIs ---
export async function getJointsApi(facilityId) {
  return apiFetch(`/joints${facilityId ? `?facilityId=${facilityId}` : ''}`);
}

export async function getJointByIdApi(jointId, facilityId) {
  return apiFetch(`/joints/${jointId}${facilityId ? `?facilityId=${facilityId}` : ''}`);
}

export async function updateJointHealthApi(jointId, updates, user, facilityId) {
  return apiFetch(`/joints/${jointId}`, {
    method: 'PATCH',
    body: JSON.stringify({ updates, user, facilityId })
  });
}

export async function getAllJointsHistoryApi(facilityId, from, to, limit = 1500) {
  const query = new URLSearchParams();
  if (facilityId) query.append('facilityId', facilityId);
  if (from) query.append('from', from);
  if (to) query.append('to', to);
  if (limit) query.append('limit', limit);
  const qs = query.toString();
  return apiFetch(`/joints/history/all${qs ? `?${qs}` : ''}`);
}

export async function getJointHistoryApi(jointId, facilityId, from, to) {
  const query = new URLSearchParams();
  if (facilityId) query.append('facilityId', facilityId);
  if (from) query.append('from', from);
  if (to) query.append('to', to);
  const qs = query.toString();
  return apiFetch(`/joints/${jointId}/history${qs ? `?${qs}` : ''}`);
}

// --- MongoDB Vision Events APIs ---
export async function getVisionEventsApi(facilityId, limit = 50) {
  return apiFetch(`/vision?facilityId=${facilityId || 'nmdc-kirandul-cv101'}&limit=${limit}`);
}

export async function createVisionEventApi(eventData) {
  return apiFetch('/vision', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
}

// --- MongoDB Sensor Reliability APIs ---
export async function getLatestReliabilityApi(facilityId) {
  return apiFetch(`/reliability${facilityId ? `?facilityId=${facilityId}` : ''}`);
}

export async function getReliabilityHistoryApi(facilityId, limit = 30) {
  return apiFetch(`/reliability/history${facilityId ? `?facilityId=${facilityId}&limit=${limit}` : ''}`);
}

export async function recordReliabilitySnapshotApi(data) {
  return apiFetch('/reliability/snapshot', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// --- MongoDB Maintenance Reports APIs ---
export async function getReportsApi(facilityId, limit = 50) {
  return apiFetch(`/reports${facilityId ? `?facilityId=${facilityId}&limit=${limit}` : ''}`);
}

export async function createReportApi(reportData) {
  return apiFetch('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData)
  });
}

export async function getReportByIdApi(reportId) {
  return apiFetch(`/reports/${reportId}`);
}

// --- MongoDB Plant Emergency Stop APIs ---
export async function getEmergencyStatusApi(facilityId) {
  return apiFetch(`/emergency/status${facilityId ? `?facilityId=${facilityId}` : ''}`);
}

export async function triggerEmergencyStopApi(facilityId, user, reason) {
  return apiFetch('/emergency/trigger', {
    method: 'POST',
    body: JSON.stringify({ facilityId, user, reason })
  });
}

export async function clearEmergencyStopApi(facilityId, user, clearRemark) {
  return apiFetch('/emergency/clear', {
    method: 'POST',
    body: JSON.stringify({ facilityId, user, clearRemark })
  });
}

// --- MongoDB Facility Config & Settings APIs ---
export async function getFacilitySettingsApi(facilityId) {
  return apiFetch(`/settings${facilityId ? `?facilityId=${facilityId}` : ''}`);
}

export async function updateFacilitySettingsApi(facilityId, thresholds, user) {
  return apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify({ facilityId, thresholds, user })
  });
}

// --- AI Assistant Chat APIs ---
export async function sendChatMessageApi(message, facilityId, user, context, history) {
  return apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      facilityId,
      user,
      context,
      history
    })
  });
}

export async function getChatHistoryApi(facilityId) {
  return apiFetch(`/chat/history${facilityId ? `?facilityId=${facilityId}` : ''}`);
}

// --- Health Check ---
export async function checkServerHealthApi() {
  return apiFetch('/health');
}

