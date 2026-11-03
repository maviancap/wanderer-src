import { describe, expect, it, afterEach, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import drizzleConfig from '../drizzle.config';
import { ensureProfile } from '../services/profiles';

afterEach(() => vi.unstubAllGlobals());
describe('profile deployment', () => {
  it('places the profiles migration where the frontend deployment discovers it', () => {
    const base = resolve(import.meta.dirname, '..');
    const migrationDir = resolve(base, drizzleConfig.out!);
    expect(migrationDir).toBe(resolve(base, 'netlify/database/migrations'));
    const sql = readdirSync(migrationDir).flatMap(entry => {
      if (entry.endsWith('.sql')) return [readFileSync(resolve(migrationDir, entry), 'utf8')];
      if (entry.includes('create_profiles')) return [readFileSync(resolve(migrationDir, entry, 'migration.sql'), 'utf8')];
      return [];
    }).join('\n');
    expect(sql).toContain('CREATE TABLE "profiles"');
  });
  it('shows a useful error when a deployment returns HTML instead of the function', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Not found</html>', { status: 404 })));
    await expect(ensureProfile()).rejects.toThrow('Profiles are temporarily unavailable.');
  });
  it('explains when the server cannot restore the signed-in session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    await expect(ensureProfile()).rejects.toThrow('Your session has expired.');
  });
  it('retains a safe server error for the retry screen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Please sign in.' }, { status: 401 })));
    await expect(ensureProfile()).rejects.toThrow('Please sign in.');
  });
});
