import { PUJAS } from '@/services/content';
import { useDownloadsStore } from '@/stores/downloads';

const INITIAL_STATUSES = { ...useDownloadsStore.getState().statuses };

beforeEach(() => {
  useDownloadsStore.setState({ statuses: { ...INITIAL_STATUSES }, installedVersions: {} });
});

describe('useDownloadsStore', () => {
  it('starts every bundled puja as already available offline', () => {
    for (const puja of PUJAS) {
      expect(useDownloadsStore.getState().statusFor(puja.id)).toBe('bundled');
      expect(useDownloadsStore.getState().isAvailableOffline(puja.id)).toBe(true);
    }
  });

  it('reports a puja with no pack at all as not downloaded', () => {
    expect(useDownloadsStore.getState().statusFor('vinayaka-chavithi')).toBe('not-downloaded');
    expect(useDownloadsStore.getState().isAvailableOffline('vinayaka-chavithi')).toBe(false);
  });

  it('walks downloading → downloaded for a future, non-bundled pack', () => {
    const id = 'vinayaka-chavithi';
    useDownloadsStore.getState().markDownloading(id);
    expect(useDownloadsStore.getState().statusFor(id)).toBe('downloading');
    expect(useDownloadsStore.getState().isAvailableOffline(id)).toBe(false);

    useDownloadsStore.getState().markDownloaded(id, '0.2.0');
    expect(useDownloadsStore.getState().statusFor(id)).toBe('downloaded');
    expect(useDownloadsStore.getState().isAvailableOffline(id)).toBe(true);
    expect(useDownloadsStore.getState().installedVersions[id]).toBe('0.2.0');
  });

  it('marks a failed download, distinct from never having tried', () => {
    const id = 'satyanarayana-vratam';
    useDownloadsStore.getState().markFailed(id);
    expect(useDownloadsStore.getState().statusFor(id)).toBe('failed');
    expect(useDownloadsStore.getState().isAvailableOffline(id)).toBe(false);
  });
});
