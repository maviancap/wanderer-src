import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { ensureProfile } from '../services/profiles';
import { onAuthChange } from '@netlify/identity';
import { getUser, processAuthCallback, authErrorMessage } from '../services/auth';

const AuthenticationStore = createContainer(() => {
  const [user, setUser] = useState(null);
  const [isPending, setIsPending] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const [profileRevision, setProfileRevision] = useState(0);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthChange((event, nextUser) => {
      if (!active) return;
      setUser(nextUser);
      if (event === 'recovery') setNeedsPasswordReset(true);
    });
    (async () => {
      try {
        const callback = await processAuthCallback();
        const current = await getUser();
        if (!active) return;
        setUser(current);
        if (callback?.type === 'recovery') {
          setNeedsPasswordReset(true);
          window.location.replace('/reset-password');
        }
      } catch (error) {
        if (active) setAuthError(authErrorMessage(error));
      } finally {
        if (active) setIsPending(false);
      }
    })();
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    setProfileReady(false); setProfileError(null);
    if (!user?.id) return;
    ensureProfile().then(() => { if (active) setProfileReady(true); })
      .catch(error => { if (active) setProfileError(error.message || 'Could not prepare your profile. Please try again.'); });
    return () => { active = false; };
  }, [user?.id, profileRevision]);

  return {
    profileReady, profileError, retryProfile: () => setProfileRevision(value => value + 1),
    user, userId: user?.id || null,
    username: user?.name || user?.userMetadata?.full_name || user?.email || null,
    isAuthenticated: !!user, isPending, authError, needsPasswordReset,
    setNeedsPasswordReset,
    // Identity accounts do not yet have balances or permissions in the game backend.
    isStaff: false, permissions: [], robux: null, tix: null,
    notificationCount: { messages: 0, trades: 0, friendRequests: 0 },
  };
});

export default AuthenticationStore;
