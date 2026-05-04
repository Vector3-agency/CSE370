import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import SubscriptionProvider, { useSubscription, type SubscriptionContextType } from './SubscriptionProvider';
import { fetchProfileResolved, type ProfileRow } from '../lib/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /** Invalidates in-flight bootstraps when the effect re-runs (e.g. React Strict Mode remount). */
  const authBootstrapGenRef = useRef(0);

  useEffect(() => {
    const gen = ++authBootstrapGenRef.current;
    let alive = true;

    setLoading(true);

    // Only unblock UI if bootstrap hangs completely (e.g. broken network). Never clear loading
    // before profile is fetched — otherwise AdminRoute sees profile=null and kicks admins out.
    const stallTimeoutId = setTimeout(() => {
      if (authBootstrapGenRef.current === gen) {
        console.warn('Auth bootstrap stalled; UI unblocked without profile resolution.');
        setLoading(false);
      }
    }, 45000);

    const bootstrap = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!alive || authBootstrapGenRef.current !== gen) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const p = await fetchProfileResolved(session.user.id);
            if (!alive || authBootstrapGenRef.current !== gen) return;
            setProfile(p);
          } catch (e) {
            console.error('Error fetching profile:', e);
            if (alive && authBootstrapGenRef.current === gen) setProfile(null);
          }
        } else if (alive && authBootstrapGenRef.current === gen) {
          setProfile(null);
        }
      } catch (e) {
        console.error('Error getting session:', e);
      } finally {
        clearTimeout(stallTimeoutId);
        if (authBootstrapGenRef.current === gen) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    // Auth callbacks must not await other Supabase calls directly (deadlock risk with GoTrue lock).
    // INITIAL_SESSION is skipped — bootstrap above already loaded session + profile.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        const uid = session?.user?.id;
        if (uid) {
          queueMicrotask(() => {
            void (async () => {
              try {
                const p = await fetchProfileResolved(uid);
                setProfile(p);
              } catch (e) {
                console.error('Error refreshing profile after token refresh:', e);
              }
            })();
          });
        }
        return;
      }

      setSession(session);
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (newUser) {
        queueMicrotask(() => {
          void (async () => {
            try {
              const p = await fetchProfileResolved(newUser.id);
              setProfile(p);
            } catch (e) {
              console.error('Error fetching profile on auth change:', e);
            }
          })();
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      alive = false;
      authBootstrapGenRef.current += 1;
      clearTimeout(stallTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfileData = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    try {
      const data = await fetchProfileResolved(uid);
      setProfile(data);
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile: refreshProfileData }}>
      <SubscriptionProvider user={user}>
        {children}
      </SubscriptionProvider>
    </AuthContext.Provider>
  );
}

export { useSubscription, type SubscriptionContextType };
