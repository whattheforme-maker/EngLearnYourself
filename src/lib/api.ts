export async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status}: ${await safeText(res)}`);
  return (await res.json()) as T;
}

export async function sendJSON<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status}: ${await safeText(res)}`);
  return (await res.json()) as T;
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "so'rov bajarilmadi";
  }
}

export const STATS_REFRESH_EVENT = "sd:stats-refresh";

export function notifyStatsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STATS_REFRESH_EVENT));
}
