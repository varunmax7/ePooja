import { currentChannel, fetchPackManifest } from '@/services/content/packManifest';

const mockEnv = {
  hasSupabase: false,
  APP_ENV: 'development' as 'development' | 'preview' | 'production',
  EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
};

jest.mock('@/lib/env', () => ({
  get env() {
    return mockEnv;
  },
}));

beforeEach(() => {
  mockEnv.hasSupabase = false;
  mockEnv.APP_ENV = 'development';
  global.fetch = jest.fn();
});

describe('currentChannel', () => {
  it('is "production" only in a production build', () => {
    mockEnv.APP_ENV = 'production';
    expect(currentChannel()).toBe('production');
  });

  it('is "preview" for development and preview builds', () => {
    mockEnv.APP_ENV = 'development';
    expect(currentChannel()).toBe('preview');
    mockEnv.APP_ENV = 'preview';
    expect(currentChannel()).toBe('preview');
  });
});

describe('fetchPackManifest', () => {
  it('returns null without making a request when no backend is configured', async () => {
    expect(await fetchPackManifest('production')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns null when the request fails', async () => {
    mockEnv.hasSupabase = true;
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    expect(await fetchPackManifest('production')).toBeNull();
  });

  it('returns null when the response does not match the schema', async () => {
    mockEnv.hasSupabase = true;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ not: 'a manifest' }),
    });
    expect(await fetchPackManifest('production')).toBeNull();
  });

  it('returns null when fetch itself throws (offline)', async () => {
    mockEnv.hasSupabase = true;
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    expect(await fetchPackManifest('production')).toBeNull();
  });

  it('parses a valid manifest and sends the anon key', async () => {
    mockEnv.hasSupabase = true;
    const body = {
      channel: 'production',
      packs: [
        {
          id: 'nitya-puja',
          version: '0.2.0',
          manifestUrl: 'https://example.supabase.co/storage/v1/object/public/content-packs/x',
          sizeBytes: 1024,
          sha256: 'abc123',
          publishedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => body });

    expect(await fetchPackManifest('production')).toEqual(body);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('channel=production'),
      expect.objectContaining({
        headers: expect.objectContaining({ apikey: 'anon-key' }),
      }),
    );
  });
});
