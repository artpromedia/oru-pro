export interface FetcherOptions extends RequestInit {
  parseJson?: boolean;
}

export async function fetcher<T = unknown>(url: string, options: FetcherOptions = {}): Promise<T> {
  const { parseJson = true, headers, ...rest } = options;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    cache: rest.cache ?? 'no-store',
    ...rest
  });

  if (!response.ok) {
    const message = await safeParseError(response);
    throw new Error(message || `Request to ${url} failed with ${response.status}`);
  }

  if (!parseJson) {
    return response as unknown as T;
  }

  return response.json() as Promise<T>;
}

async function safeParseError(response: Response): Promise<string | null> {
  try {
    const data = await response.json();
    if (typeof data === 'string') return data;
    if (data?.message) return data.message as string;
    return JSON.stringify(data);
  } catch {
    return response.statusText || null;
  }
}
