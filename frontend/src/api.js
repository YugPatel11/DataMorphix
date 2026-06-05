import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // AI calls can be slow
});

// ── Dataset CRUD ──

export async function fetchDatasets() {
  const res = await api.get('/datasets/');
  return res.data;
}

export async function fetchDataset(id) {
  const res = await api.get(`/datasets/${id}/`);
  return res.data;
}

export async function uploadDataset(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/datasets/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function deleteDataset(id) {
  await api.delete(`/datasets/${id}/`);
}

// ── Natural Language Query ──

export async function queryDataset(id, query) {
  const res = await api.post(`/datasets/${id}/query/`, { query });
  return res.data;
}

// ── Export ──

export function getExportUrl(id, format) {
  return `${API_BASE}/datasets/${id}/export/?type=${format}`;
}

export function exportDataset(id, format) {
  const url = getExportUrl(id, format);
  window.open(url, '_blank');
}

// ── Governance ──

export async function getGovernance(id) {
  const res = await api.get(`/datasets/${id}/governance/`);
  return res.data;
}

// ── Usage Insights ──

export async function getUsageInsights(id) {
  const res = await api.get(`/datasets/${id}/usage_insights/`);
  return res.data;
}

// Column relationships inside one selected dataset
export async function getInternalRelations(id) {
  const res = await api.get(`/datasets/${id}/internal-relations/`);
  return res.data;
}

// Rename Suggestions
export async function getRenameSuggestions(id) {
  const res = await api.get(`/datasets/${id}/rename-suggestions/`);
  return res.data;
}

// ── Search ──

export async function searchDatasets(query) {
  const res = await api.get('/search/', { params: { q: query } });
  return res.data;
}

// ── Reprocess ──

export async function reprocessDataset(id) {
  const res = await api.post(`/datasets/${id}/reprocess/`);
  return res.data;
}

export default api;
