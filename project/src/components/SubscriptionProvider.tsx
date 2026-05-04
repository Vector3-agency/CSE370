import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused';
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
  created_at: string | null;
}

export interface SubscriptionContextType {
  subscription: Subscription | null;
  hasActiveAccess: boolean;
  isTrialing: boolean;
  isSubscribed: boolean;
  trialDaysRemaining: number | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  hasActiveAccess: false,
  isTrialing: false,
  isSubscribed: false,
  trialDaysRemaining: null,
  loading: true,
  refreshSubscription: async () => {},
});

function trialDaysRemainingFromSubscription(sub: Subscription | null): number | null {
  if (!sub || sub.status !== 'trialing') return null;
  const endIso = sub.trial_ends_at || sub.current_period_end;
  if (!endIso) return null;
  return Math.max(0, Math.ceil((new Date(endIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export const useSubscription = () => useContext(SubscriptionContext);

interface SubscriptionProviderProps {
  children: ReactNode;
  user: User | null;
}

export default function SubscriptionProvider({ children, user }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Use user.id (stable string) instead of the whole user object to avoid
  // re-fetching every time Supabase refreshes the token and creates a new user reference
  const userId = user?.id ?? null;

  const fetchSubscriptionData = useCallback(async (isSilent = false) => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      if (!isSilent) {
        setLoading(true);
      }

      const subscriptionResult = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (subscriptionResult.error && !subscriptionResult.error.message.includes('does not exist')) {
        console.error('Error fetching subscription:', subscriptionResult.error);
      }
      setSubscription(subscriptionResult.data ?? null);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    void fetchSubscriptionData(false);
  }, [userId, fetchSubscriptionData]);

  // When the user returns to this tab (e.g. after pressing Back from Stripe),
  // re-fetch subscription data so the UI updates immediately.
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Background/Silent refresh when user returns to tab
      if (document.visibilityState === 'visible' && userId) {
        fetchSubscriptionData(true); 
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, fetchSubscriptionData]);

  // Access is granted to all users - subscription is optional for premium features
  // hasActiveAccess can be used to show upgrade prompts for premium features, but won't block access
  const hasActiveAccess = true;

  const isTrialing = subscription?.status === 'trialing';

  function isSubscribedValue() {
    return subscription?.status === 'active' || subscription?.status === 'trialing';
  }

  const isSubscribed = isSubscribedValue();

  const trialDaysRemaining = trialDaysRemainingFromSubscription(subscription);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        hasActiveAccess,
        isTrialing,
        isSubscribed,
        trialDaysRemaining,
        loading,
        refreshSubscription: fetchSubscriptionData,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}