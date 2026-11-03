import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AuthenticationStore from '../stores/authentication';
import { logout, authErrorMessage } from '../services/auth';
import styles from '../components/accountAuth/styles.module.css';

export default function AccountPage() {
  const auth = AuthenticationStore.useContainer();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!auth.isPending && !auth.isAuthenticated) router.replace('/login');
  }, [auth.isPending, auth.isAuthenticated, router]);
  if (auth.isPending || !auth.isAuthenticated) return <section className={styles.panel}><p role='status'>Checking your session…</p></section>;
  return <section className={styles.panel}>
    <p className={styles.eyebrow}>WANDERER / YOUR ACCOUNT</p>
    <h1>Welcome, {auth.username}</h1>
    <p>You’re signed in as <strong>{auth.user.email}</strong>.</p>
    {auth.profileError && <p role='alert'>{auth.profileError} <button onClick={auth.retryProfile}>Try again</button></p>}
    {auth.profileReady ? <p><a href={`/users/${auth.userId}/profile`}>View my profile</a></p> : !auth.profileError && <p role='status'>Preparing your profile…</p>}
    <p><a href='/games'>Browse games</a> · <a href='/catalog'>Explore the catalog</a></p>
    {error && <p role='alert' className={styles.error}>{error}</p>}
    <button disabled={busy} onClick={async () => {
      setBusy(true); setError('');
      try { await logout(); window.location.assign('/login'); }
      catch (err) { setError(authErrorMessage(err)); setBusy(false); }
    }}>{busy ? 'Signing out…' : 'Sign out'}</button>
    <a href='/forgot-password'>Reset your password</a>
  </section>;
}
