# Website accounts

Website accounts use Netlify Identity through `@netlify/identity`. Identity stores
account credentials and manages confirmation emails and persistent sessions.

- `/` and `/signup` offer email signup with a display name and password.
- `/login` signs in with an email and password.
- `/account` shows the current account and offers sign out.
- `/forgot-password` requests a recovery email.
- `/reset-password` accepts a new password after the recovery link is opened.

The shared authentication store handles email confirmation and recovery callbacks
on any page, restores the session on reload, and subscribes to session changes
across tabs. New users must confirm their email unless the project's Identity
settings enable automatic confirmation. Failed or expired confirmation links
show an error instead of leaving the page loading.

Identity accounts are website accounts. They are not automatically mapped to the
separate game backend's numeric user profiles, balances, inventory, or gameplay
sessions. The account navigation therefore links to the website account page
rather than requesting game profile data with an Identity user ID. Existing game
backend accounts have not been migrated.

Run `npm test` from `frontend` for signup validation, confirmation messaging,
login errors, recovery forms, session restoration, and logout tests. Live email
delivery and confirmation links require a deployment with Identity enabled.

Website accounts now receive a persistent public profile on sign-in. Signup
confirmation and login lead to the existing `/users/[userId]/profile` page,
rendered by the original `userProfile` components and `UserProfileStore`.
Profiles store their display name, About text, status, and creation date in
Netlify Database. Profile IDs match the account's Identity ID; legacy game
accounts are not automatically migrated or linked.

Signed-in owners can edit About text and status in the original profile layout.
The profile function verifies the session, derives ownership from that session,
and rejects cross-origin writes. Public responses contain only profile fields,
never account emails or credentials. Game-specific content remains empty until
the game services are connected.

The frontend project's database schema lives in `frontend/db/schema.ts`, with
its generated deployment migration in `frontend/netlify/database/migrations`,
relative to the configured frontend deployment directory. The platform applies that migration during deployment. Profile
creation is idempotent, so existing website accounts also receive a profile the
next time their session is restored.
