import { useQuery } from "@tanstack/react-query";
import { useWallet } from "./use-wallet";

export interface CastLimitData {
  date: string;
  count: number;
  remaining: number;
  maxDailyCasts: number;
  canCast: boolean;
  limitReached: boolean;
  resetIn?: number; // Seconds until next reset (03:00 TR time)
}

export function useCastLimits() {
  const { user } = useWallet();

  const query = useQuery({
    queryKey: ['/api/cast-limits', user?.id],
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  return {
    ...query,
    data: query.data as CastLimitData | undefined,
    isLoading: query.isLoading,
    error: query.error,
  };
}