const BASE = '/api/backend';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Inputs
  analyzeInput: (text: string) =>
    request<{ input: any; items: any[]; count: number }>('inputs', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  previewInput: (text: string) =>
    request<{ items: any[]; count: number }>('inputs/preview', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  getInputs: () => request<any[]>('inputs'),

  // Items
  getItems: (filters?: { category?: string; status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    const q = params.toString();
    return request<any[]>(`items${q ? '?' + q : ''}`);
  },

  createItem: (data: any) =>
    request<any>('items', { method: 'POST', body: JSON.stringify(data) }),

  updateItem: (id: string, data: any) =>
    request<any>(`items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteItem: (id: string) =>
    request<{ success: boolean }>(`items/${id}`, { method: 'DELETE' }),

  completeItem: (id: string) =>
    request<any>(`items/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'COMPLETED' }) }),

  snoozeItem: (id: string, hours: number = 24) =>
    request<any>(`items/${id}/snooze`, { method: 'POST', body: JSON.stringify({ hours }) }),

  sendReminder: (id: string) =>
    request<any>(`items/${id}/remind`, { method: 'POST', body: JSON.stringify({ sendNow: true }) }),

  scheduleReminder: (id: string, scheduledAt: string, type: string = 'CUSTOM') =>
    request<any>(`items/${id}/remind`, { method: 'POST', body: JSON.stringify({ scheduledAt, type }) }),

  // Dashboard
  getDashboard: () => request<any>('dashboard'),

  // Users
  getMe: () => request<any>('users/me'),
  getStats: () => request<any>('users/stats'),
};
