import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - Stops refetching when user swaps tabs
      gcTime: 1000 * 60 * 30, // 30 minutes - Keeps data in memory longer for instant feel
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
