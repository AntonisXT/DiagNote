import { useAuth } from '@clerk/nextjs';

export function useProStatus(): { isPro: boolean; isLoaded: boolean } {
  const { isLoaded, has } = useAuth();
  if (!isLoaded) return { isPro: false, isLoaded: false };
  const isPro = has?.({ plan: 'premium_subscription' }) ?? false;
  return { isPro, isLoaded: true };
}
