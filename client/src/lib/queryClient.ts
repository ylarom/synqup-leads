import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [url, ...params] = queryKey;
    let fullUrl = url as string;
    
    // Build query parameters from remaining queryKey elements
    if (params.length > 0) {
      const searchParams = new URLSearchParams();
      
      // Handle common parameter patterns
      if (params.length >= 2) {
        searchParams.append('limit', String(params[0]));
        searchParams.append('offset', String(params[1]));
      }
      if (params.length >= 3 && params[2]) {
        searchParams.append('search', String(params[2]));
      }
      if (params.length >= 4 && params[3]) {
        searchParams.append('accountId', String(params[3]));
      }
      if (params.length >= 4 && params[3] && fullUrl.includes('messages')) {
        searchParams.append('status', String(params[2]));
      }
      if (params.length >= 4 && params[3] && fullUrl.includes('triggers')) {
        searchParams.append('status', String(params[2]));
      }
      
      if (searchParams.toString()) {
        fullUrl += '?' + searchParams.toString();
      }
    }

    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
