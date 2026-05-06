const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  registerOptions: () => apiFetch<{ data: { userId: string; options: any } }>('/api/v1/auth/passkeys/register/options', { method: 'POST' }),
  registerVerify: (userId: string, credential: any) => apiFetch('/api/v1/auth/passkeys/register/verify', {
    method: 'POST', body: JSON.stringify({ userId, credential }),
  }),
  loginOptions: () => apiFetch<{ data: { options: any } }>('/api/v1/auth/passkeys/login/options', { method: 'POST' }),
  loginVerify: (credential: any) => apiFetch('/api/v1/auth/passkeys/login/verify', {
    method: 'POST', body: JSON.stringify({ credential }),
  }),
  getMe: () => apiFetch<{ data: any }>('/api/v1/me'),

  // Addresses
  importAddress: (data: any) => apiFetch('/api/v1/addresses/import', {
    method: 'POST', body: JSON.stringify(data),
  }),
  getAddresses: () => apiFetch<{ data: any[] }>('/api/v1/addresses'),
  patchAddress: (id: string, data: any) => apiFetch(`/api/v1/addresses/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  }),
  deactivateAddress: (id: string) => apiFetch(`/api/v1/addresses/${id}`, { method: 'DELETE' }),
  syncAddress: (id: string) => apiFetch(`/api/v1/addresses/${id}/sync`, { method: 'POST' }),

  // Portfolio
  getOverview: () => apiFetch<{ data: any }>('/api/v1/portfolio/overview'),
  getHoldings: () => apiFetch<{ data: any[] }>('/api/v1/portfolio/holdings'),
  getTimeseries: (from: string, to: string) => apiFetch<{ data: any }>(`/api/v1/portfolio/timeseries?from=${from}&to=${to}`),

  // PnL
  getPnlSummary: (from: string, to: string) => apiFetch<{ data: any }>(`/api/v1/pnl/summary?from=${from}&to=${to}`),
  getPnlDaily: (from: string, to: string) => apiFetch<{ data: any }>(`/api/v1/pnl/daily?from=${from}&to=${to}`),

  // Activity
  getActivity: (params?: string) => apiFetch<{ data: any[] }>(`/api/v1/activity${params ? `?${params}` : ''}`),

  // Flows
  reclassifyFlow: (id: string, data: any) => apiFetch(`/api/v1/flows/${id}/reclassify`, {
    method: 'POST', body: JSON.stringify(data),
  }),

  // Providers (optional - used in settings)
  getProviders: () => apiFetch<{ data: { providers: any[] } }>('/api/v1/system/providers'),
};
