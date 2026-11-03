import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AuthenticationStore from '../../stores/authentication';
import { login, signup, recoverPassword, resetPassword, getUser, authErrorMessage } from '../../services/auth';
import styles from './styles.module.css';

export default function AccountAuth({ mode = 'login' }) {
  const auth = AuthenticationStore.useContainer();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const isSignup = mode === 'signup';
  const isRecovery = mode === 'recovery';
  const isReset = mode === 'reset';

  useEffect(() => {
    if (!auth.isPending && auth.isAuthenticated && !isReset && !isRecovery && !auth.needsPasswordReset) {
      router.replace(`/users/${auth.userId}/profile`);
    }
  }, [auth.isPending, auth.isAuthenticated, auth.userId, auth.needsPasswordReset, isReset, isRecovery, router]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(''); setMessage('');
    try {
      const email = String(data.get('email') || '');
      const password = String(data.get('password') || '');
      if ((isSignup || isReset) && password !== data.get('confirmPassword')) {
        throw new Error('Passwords do not match.');
      }
      if (isSignup) {
        await signup({ email, password, username: String(data.get('username') || '') });
        const currentUser = await getUser();
        if (currentUser) window.location.assign(`/users/${currentUser.id}/profile`);
        else setMessage('Account created. Check your email and follow the confirmation link before signing in.');
      } else if (isRecovery) {
        await recoverPassword(email);
        setMessage('If an account exists for that email, a password reset link is on its way.');
      } else if (isReset) {
        await resetPassword(password);
        auth.setNeedsPasswordReset(false);
        window.location.assign('/account');
      } else {
        const currentUser = await login({ email, password });
        window.location.assign(`/users/${currentUser.id}/profile`);
      }
    } catch (err) { setError(authErrorMessage(err)); }
    finally { setBusy(false); }
  }

  const title = isSignup ? 'Create your account' : isRecovery ? 'Forgot your password?' : isReset ? 'Choose a new password' : 'Welcome back';
  return <section className={styles.panel}>
    <p className={styles.eyebrow}>WANDERER / ACCOUNTS</p>
    <h1>{title}</h1>
    <p>{isSignup ? 'Your next adventure starts here.' : isRecovery ? 'Enter your email to receive a reset link.' : isReset ? 'Set a password you haven’t used before.' : 'Sign in to your Wanderer account.'}</p>
    {(error || auth.authError) && <p role='alert' className={styles.error}>{error || auth.authError}</p>}
    {message && <p role='status' className={styles.success}>{message}</p>}
    {auth.isPending ? <p role='status'>Checking your session…</p> : isReset && !auth.isAuthenticated ?
      <p>Open the reset link from your email, or <a href='/forgot-password'>request a new link</a>.</p> :
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {isSignup && <label>Display name<input name='username' autoComplete='nickname' minLength={3} maxLength={32} required pattern='[A-Za-z0-9_]{3,32}' title='Use 3–32 letters, numbers, or underscores.' /></label>}
          {!isReset && <label>Email<input name='email' type='email' autoComplete='email' required maxLength={254} /></label>}
          {!isRecovery && <label>Password<input name='password' type='password' autoComplete={isSignup || isReset ? 'new-password' : 'current-password'} minLength={isSignup || isReset ? 8 : undefined} required /></label>}
          {(isSignup || isReset) && <><small>Use at least 8 characters.</small><label>Confirm password<input name='confirmPassword' type='password' autoComplete='new-password' minLength={8} required /></label></>}
          <button type='submit'>{busy ? 'Please wait…' : isSignup ? 'Create account' : isRecovery ? 'Send reset link' : isReset ? 'Save password' : 'Sign in'}</button>
        </fieldset>
      </form>}
    <div className={styles.links}>
      {isSignup ? <p>Already a member? <a href='/login'>Sign in</a></p> : <p>New here? <a href='/signup'>Create an account</a></p>}
      {mode === 'login' && <a href='/forgot-password'>Forgot password?</a>}
      {(isReset || isRecovery) && <a href='/login'>Back to sign in</a>}
    </div>
  </section>;
}
