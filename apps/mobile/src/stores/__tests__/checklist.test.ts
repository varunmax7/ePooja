import { storage } from '@/lib/storage';
import { CHECKLIST_STORAGE_KEY, checklistKey, useChecklistStore } from '@/stores/checklist';

const PUJA = 'nitya-puja-short';
const TODAY = '2026-09-21';
const TOMORROW = '2026-09-22';

beforeEach(() => {
  storage.clearAll();
  useChecklistStore.setState({ entries: {}, hydrated: true });
});

describe('toggling items', () => {
  it('starts with nothing checked', () => {
    expect(useChecklistStore.getState().checkedIds(PUJA, TODAY)).toEqual([]);
    expect(useChecklistStore.getState().isChecked(PUJA, TODAY, 'deepam')).toBe(false);
  });

  it('checks and unchecks an item', () => {
    useChecklistStore.getState().toggle(PUJA, TODAY, 'deepam');
    expect(useChecklistStore.getState().isChecked(PUJA, TODAY, 'deepam')).toBe(true);

    useChecklistStore.getState().toggle(PUJA, TODAY, 'deepam');
    expect(useChecklistStore.getState().isChecked(PUJA, TODAY, 'deepam')).toBe(false);
  });

  it('tracks several items independently', () => {
    useChecklistStore.getState().toggle(PUJA, TODAY, 'deepam');
    useChecklistStore.getState().toggle(PUJA, TODAY, 'akshatalu');

    expect(useChecklistStore.getState().checkedIds(PUJA, TODAY).sort()).toEqual([
      'akshatalu',
      'deepam',
    ]);
  });

  it("keeps each puja's checklist separate on the same day", () => {
    useChecklistStore.getState().toggle(PUJA, TODAY, 'deepam');
    expect(useChecklistStore.getState().checkedIds('ganapathi-puja', TODAY)).toEqual([]);
  });

  it('clears one day without touching another', () => {
    useChecklistStore.getState().toggle(PUJA, TODAY, 'deepam');
    useChecklistStore.getState().toggle(PUJA, TOMORROW, 'karpuram');

    useChecklistStore.getState().clearDay(PUJA, TODAY);

    expect(useChecklistStore.getState().checkedIds(PUJA, TODAY)).toEqual([]);
    expect(useChecklistStore.getState().checkedIds(PUJA, TOMORROW)).toEqual(['karpuram']);
  });
});

describe('§10 Phase 4: survives restart, resets next day', () => {
  it('survives a relaunch on the same day', async () => {
    useChecklistStore.getState().toggle(PUJA, TODAY, 'deepam');
    useChecklistStore.getState().toggle(PUJA, TODAY, 'kalasham');

    // What a killed process actually leaves behind is the bytes on disk.
    const onDisk = storage.getString(CHECKLIST_STORAGE_KEY);
    expect(onDisk).toBeDefined();

    useChecklistStore.setState({ entries: {}, hydrated: false });
    storage.set(CHECKLIST_STORAGE_KEY, onDisk as string);
    await useChecklistStore.persist.rehydrate();

    expect(useChecklistStore.getState().checkedIds(PUJA, TODAY).sort()).toEqual([
      'deepam',
      'kalasham',
    ]);
    expect(useChecklistStore.getState().hydrated).toBe(true);
  });

  it('starts the next day clean, without erasing the previous day', () => {
    useChecklistStore.getState().toggle(PUJA, TODAY, 'deepam');

    // No midnight job runs: the next day simply reads a different key.
    expect(useChecklistStore.getState().checkedIds(PUJA, TOMORROW)).toEqual([]);
    expect(useChecklistStore.getState().checkedIds(PUJA, TODAY)).toEqual(['deepam']);
  });

  it('keys an entry by both puja and date', () => {
    expect(checklistKey(PUJA, TODAY)).toBe('nitya-puja-short:2026-09-21');
  });
});

describe('pruneOldEntries', () => {
  it('drops entries older than a week but keeps recent ones', () => {
    useChecklistStore.getState().toggle(PUJA, '2026-09-01', 'deepam');
    useChecklistStore.getState().toggle(PUJA, '2026-09-20', 'deepam');
    useChecklistStore.getState().toggle(PUJA, TODAY, 'deepam');

    useChecklistStore.getState().pruneOldEntries(TODAY);

    expect(useChecklistStore.getState().checkedIds(PUJA, '2026-09-01')).toEqual([]);
    expect(useChecklistStore.getState().checkedIds(PUJA, '2026-09-20')).toEqual(['deepam']);
    expect(useChecklistStore.getState().checkedIds(PUJA, TODAY)).toEqual(['deepam']);
  });

  it('is safe to run when there is nothing to prune', () => {
    useChecklistStore.getState().pruneOldEntries(TODAY);
    expect(useChecklistStore.getState().entries).toEqual({});
  });
});
