// client/src/_core/hooks/useAuth.ts
import { trpc } from '@/lib/trpc';

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
  };
}