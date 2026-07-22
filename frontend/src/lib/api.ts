const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  stats: () => request<any>("/stats"),
  knowledgeHealth: () => request<any>("/knowledge-health"),
  plantTwin: () => request<any>("/plant-twin"),
  equipment: () => request<any[]>("/equipment"),
  equipmentDetail: (id: string) => request<any>(`/equipment/${id}`),
  timeline: (id: string) => request<any[]>(`/timeline/${id}`),
  graph: (equipmentId?: string) =>
    request<any>(`/graph${equipmentId ? `?equipment_id=${equipmentId}` : ""}`),
  documents: () => request<any[]>("/documents"),
  document: (id: string) => request<any>(`/documents/${id}`),
  conflicts: () => request<any[]>("/conflicts"),
  gaps: () => request<any[]>("/gaps"),
  recommendations: () => request<any[]>("/recommendations"),
  notifications: () => request<any[]>("/notifications"),
  search: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),
  searchCompare: (q: string) =>
    request<any>(`/search/compare?q=${encodeURIComponent(q)}`),
  chat: (body: {
    message: string;
    mode?: string;
    equipment_id?: string | null;
    image_b64?: string | null;
  }) =>
    request<any>("/chat", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  simulate: (equipment_id: string, scenario = "postpone_maintenance") =>
    request<any>("/simulate", {
      method: "POST",
      body: JSON.stringify({ equipment_id, scenario }),
    }),
  upload: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<any>("/upload", { method: "POST", body: fd });
  },
  runDemo: () => request<any>("/demo/run", { method: "POST" }),
  incidentStory: () => request<any>("/incident-story"),
  incidentPdfUrl: `${API_URL}/incident-story/pdf`,
};
