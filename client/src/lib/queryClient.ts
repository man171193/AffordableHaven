import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      
      if (errorData.error) {
        throw new Error(errorData.error);
      } else if (errorData.errors && Array.isArray(errorData.errors)) {
        throw new Error(errorData.errors.join(', '));
      } else if (errorData.message) {
        throw new Error(errorData.message);
      }
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
    }
    
    throw new Error(`${res.status}: ${res.statusText}`);
  }
}

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown | undefined,
): Promise<Response> {
  // For PUT and DELETE requests, convert to PHP style
  let url = endpoint;
  if ((method === 'PUT' || method === 'DELETE') && endpoint.match(/\/(\d+)$/)) {
    // Extract ID from URL
    const matches = endpoint.match(/\/(\d+)$/);
    if (matches && matches[1]) {
      const id = matches[1];
      url = endpoint.replace(/\/\d+$/, '');
      url += '?id=' + id;
    }
  }
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

// Modified to work with PHP endpoints
export const getQueryFn: <T>(options: {
  on401: "returnNull" | "throw";
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // Handle ID parameter for GET requests
    if (typeof queryKey[1] === 'number') {
      // For an ID parameter, add it as a query parameter instead of path parameter
      url = `${url}?id=${queryKey[1]}`;
    }
    
    const res = await fetch(url);

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
      staleTime: 60000, // 1 minute
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
