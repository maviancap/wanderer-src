import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getDb: vi.fn() }));
vi.mock('@netlify/identity', () => ({ getUser: mocks.getUser }));
vi.mock('../db/index.js', () => ({ getDb: mocks.getDb }));
import handler from '../netlify/functions/profiles.mts';
const ownId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const profile = { id: ownId, name: 'Wanderer', description: 'Hello', status: '', created: '2026-11-03T00:00:00.000Z' };
function request(method: string, body?: unknown, origin = 'https://site.example') {
  return new Request('https://site.example/.netlify/functions/profiles', {
    method, headers: { origin, 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
beforeEach(() => { vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ id: ownId, name: 'Wanderer' }); });
describe('profile authorization and data', () => {
  it('rejects anonymous edits without accessing storage', async () => {
    mocks.getUser.mockResolvedValue(null);
    expect((await handler(request('PATCH', { description: 'Changed' }))).status).toBe(401);
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it('rejects cross-site mutations before reading the session', async () => {
    expect((await handler(request('POST', undefined, 'https://other.example'))).status).toBe(403);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it('rejects attempts to choose another profile or change privileges', async () => {
    mocks.getDb.mockReturnValue({});
    const response = await handler(request('PATCH', { id: otherId, description: 'Changed', roles: ['admin'] }));
    expect(response.status).toBe(400);
  });
  it('validates bio and status length', async () => {
    mocks.getDb.mockReturnValue({});
    expect((await handler(request('PATCH', { description: 'a'.repeat(2001) }))).status).toBe(400);
    expect((await handler(request('PATCH', { status: 'a'.repeat(256) }))).status).toBe(400);
  });
  it('updates only the authenticated profile', async () => {
    const returning = vi.fn().mockResolvedValue([profile]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.getDb.mockReturnValue({ update: () => ({ set }) });
    const response = await handler(request('PATCH', { description: 'Hello' }));
    expect(response.status).toBe(200);
    expect(set.mock.calls[0][0].description).toBe('Hello');
    const condition = where.mock.calls[0][0];
    expect(condition.queryChunks.some((chunk: { value?: unknown }) => chunk.value === ownId)).toBe(true);
  });
  it('returns not found for an invalid profile ID without a database query', async () => {
    const response = await handler(new Request('https://site.example/.netlify/functions/profiles?id=bad'));
    expect(response.status).toBe(404);
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it('allows public viewing without requiring a session', async () => {
    const limit = vi.fn().mockResolvedValue([profile]);
    mocks.getDb.mockReturnValue({ select: () => ({ from: () => ({ where: () => ({ limit }) }) }) });
    const response = await handler(new Request(`https://site.example/.netlify/functions/profiles?id=${ownId}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it('creates profiles from verified identity, ignoring supplied ownership', async () => {
    const values = vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) });
    mocks.getDb.mockReturnValue({
      insert: () => ({ values }),
      select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([profile]) }) }) }),
    });
    expect((await handler(request('POST', { id: otherId }))).status).toBe(200);
    expect(values).toHaveBeenCalledWith({ id: ownId, name: 'Wanderer' });
  });
});
