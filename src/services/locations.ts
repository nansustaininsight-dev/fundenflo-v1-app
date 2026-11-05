import { api } from '@/services/api';

function rowsOf(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: unknown[] }).items;
  }
  return [];
}

export async function searchCities(search: string): Promise<string[]> {
  const params = new URLSearchParams({ page: '1', limit: '20' });
  const query = search.trim();
  if (query) params.set('search', query);
  const data = await api<unknown>(`/locations/cities?${params.toString()}`);
  const labels: string[] = [];
  for (const row of rowsOf(data)) {
    if (typeof row === 'string' && row) labels.push(row);
    else if (row && typeof row === 'object' && typeof (row as { label?: unknown }).label === 'string') {
      const label = (row as { label: string }).label.trim();
      if (label) labels.push(label);
    }
  }
  return labels;
}
