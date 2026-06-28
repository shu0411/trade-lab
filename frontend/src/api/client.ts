import axios from 'axios';
import type { Entry, PatternStat, ReasonStat, Summary } from '../types/entry';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({ baseURL: BASE });

export const getEntries = (params?: { type?: string; status?: string }) =>
  api.get<Entry[]>('/entries', { params }).then((r) => r.data);

export const createEntry = (body: object) => api.post<Entry>('/entries', body).then((r) => r.data);

export const getEntry = (id: string) => api.get<Entry>(`/entries/${id}`).then((r) => r.data);

export const updateResult = (id: string, body: object) =>
  api.put<Entry>(`/entries/${id}`, body).then((r) => r.data);

export const deleteEntry = (id: string) => api.delete(`/entries/${id}`);

export const getPresignedUrl = (filename: string, contentType: string) =>
  api
    .post<{ url: string; key: string }>('/upload/presigned', { filename, contentType })
    .then((r) => r.data);

export const getSignedReadUrl = (key: string) =>
  api.get<{ url: string }>(`/upload/signed-url/${key}`).then((r) => r.data);

export const getSummary = () => api.get<Summary>('/analysis/summary').then((r) => r.data);

export const getPatternStats = () =>
  api.get<PatternStat[]>('/analysis/patterns').then((r) => r.data);

export const getReasonStats = () => api.get<ReasonStat[]>('/analysis/reasons').then((r) => r.data);

export const uploadChartImage = async (file: File): Promise<string> => {
  const { url, key } = await getPresignedUrl(file.name, file.type);
  await axios.put(url, file, { headers: { 'Content-Type': file.type } });
  return key;
};
