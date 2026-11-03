import { getUser } from '@netlify/identity';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { profiles } from '../../db/schema.js';

const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});
const validId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const handler = async (req: Request) => {
  const url = new URL(req.url);
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, POST, PATCH' } });
  }
  try {
    if (req.method === 'GET') {
      const id = url.searchParams.get('id') || '';
      if (!validId(id)) return json({ error: 'Profile not found.' }, 404);
      const [profile] = await getDb().select().from(profiles).where(eq(profiles.id, id)).limit(1);
      return profile ? json(profile) : json({ error: 'Profile not found.' }, 404);
    }
    // Cookie authentication requires a same-origin check for all mutations.
    if (req.headers.get('origin') !== url.origin) return json({ error: 'Request origin is not allowed.' }, 403);
    const user = await getUser();
    if (!user) return json({ error: 'Please sign in.' }, 401);
    const db = getDb();
    if (req.method === 'POST') {
      const rawName = user.name || user.userMetadata?.full_name;
      const name = typeof rawName === 'string' && rawName.trim() ? rawName.trim().slice(0, 32) : 'Wanderer';
      // Profile creation is idempotent, including simultaneous requests from tabs.
      await db.insert(profiles).values({ id: user.id, name }).onConflictDoNothing();
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
      return json(profile);
    }
    if (Number(req.headers.get('content-length')) > 16000) return json({ error: 'Profile update is too large.' }, 413);
    let body;
    try { body = await req.json(); } catch { return json({ error: 'Invalid profile update.' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid profile update.' }, 400);
    const allowed = ['description', 'status'];
    if (Object.keys(body).some(key => !allowed.includes(key)) || !Object.keys(body).length) {
      return json({ error: 'Only your About text and status can be updated.' }, 400);
    }
    for (const [key, value] of Object.entries(body)) {
      const max = key === 'description' ? 2000 : 255;
      if (typeof value !== 'string' || value.length > max) return json({ error: `${key === 'description' ? 'About text' : 'Status'} must be at most ${max} characters.` }, 400);
    }
    // The target comes exclusively from the verified session, never the request body.
    const [profile] = await db.update(profiles).set({ ...body, updatedAt: new Date() })
      .where(eq(profiles.id, user.id)).returning();
    return profile ? json(profile) : json({ error: 'Profile not found.' }, 404);
  } catch {
    return json({ error: 'Profiles are temporarily unavailable. Please try again.' }, 503);
  }
};

export default handler;
