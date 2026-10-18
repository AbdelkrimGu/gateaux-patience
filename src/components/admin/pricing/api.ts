/**
 * Error carrying the server's French message; `conflict` = edited elsewhere
 * (409); `expired` = the admin session ended (401), she must log in again.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly conflict: boolean,
    readonly expired = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ErrorInfo {
  text: string;
  conflict: boolean;
  expired?: boolean;
}

/** JSON fetch for the pricing API: throws an ApiError carrying the server's French message. */
export async function apiJson<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body: unknown,
  fallback: string
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Connexion impossible. Vérifiez votre réseau et réessayez.", 0, false);
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; conflict?: boolean };
    if (res.status === 401) {
      throw new ApiError(err.error || "Session expirée : reconnectez-vous.", 401, false, true);
    }
    const conflict = res.status === 409 || err.conflict === true;
    throw new ApiError(
      err.error ||
        (conflict ? "Ces données ont été modifiées ailleurs entre-temps. Rechargez la page." : fallback),
      res.status,
      conflict
    );
  }
  return (await res.json()) as T;
}

export function errorText(e: unknown): ErrorInfo {
  return {
    text: e instanceof Error ? e.message : "Erreur",
    conflict: e instanceof ApiError && e.conflict,
    expired: e instanceof ApiError && e.expired,
  };
}
