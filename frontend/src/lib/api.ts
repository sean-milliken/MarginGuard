import { userPool } from "../config/cognito";
const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
async function token(): Promise<string | undefined> {
  if (import.meta.env.VITE_MOCK_MODE === "true") return undefined;
  const user = userPool.getCurrentUser();
  if (!user) return undefined;
  return new Promise((resolve, reject) =>
    user.getSession(
      (
        error: Error | null,
        session: { getIdToken(): { getJwtToken(): string } } | null,
      ) =>
        error ? reject(error) : resolve(session?.getIdToken().getJwtToken()),
    ),
  );
}
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const jwt = await token();
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : (data.error?.message ?? `Request failed (${response.status})`),
    );
  return data as T;
}
