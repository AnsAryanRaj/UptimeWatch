const API_BASE = '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

export async function fetchWebsites() {
  const res = await fetch(`${API_BASE}/websites`);
  if (!res.ok) throw new Error('Failed to fetch monitored websites');
  return res.json();
}

export async function createWebsite(data) {
  const res = await fetch(`${API_BASE}/websites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to add website');
  }
  return res.json();
}

export async function deleteWebsite(id) {
  const res = await fetch(`${API_BASE}/websites/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to delete website');
  }
  return true;
}

export async function checkWebsite(id) {
  const res = await fetch(`${API_BASE}/websites/${id}/check`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger check');
  return res.json();
}

export async function checkAllWebsites() {
  const res = await fetch(`${API_BASE}/check-all`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger check all');
  return res.json();
}

export async function fetchWebsiteHistory(id, limit = 20) {
  const res = await fetch(`${API_BASE}/websites/${id}/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch check history');
  return res.json();
}
