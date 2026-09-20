import { storage } from '@/lib/storage';
import { DEVOTEE_STORAGE_KEY, useDevoteeStore, hasOnboarded } from '@/stores/devotee';
import type { NewDevotee } from '@/stores/devotee';

const draft: NewDevotee = {
  name: { te: '', en: 'Ramavath Varun' },
  gender: 'male',
  nakshatraId: 'rohini',
  nakshatraPada: 3,
  rasiId: 'vrishabha',
  location: {
    lat: 17.385,
    lng: 78.4867,
    tz: 'Asia/Kolkata',
    cityId: 'hyderabad',
    label: 'Hyderabad, Telangana',
  },
};

beforeEach(() => {
  storage.clearAll();
  useDevoteeStore.setState({ devotee: null, onboardedAt: null, hydrated: true });
});

describe('creating a devotee', () => {
  it('fills in the id, timestamps, empty family and default prefs', () => {
    useDevoteeStore.getState().createDevotee(draft);
    const devotee = useDevoteeStore.getState().devotee;

    expect(devotee?.id).toMatch(/^devotee_/);
    expect(devotee?.family).toEqual([]);
    expect(devotee?.createdAt).toBe(devotee?.updatedAt);
    // §9.6.1: never a cloned voice unless the devotee asks.
    expect(devotee?.prefs.nameAudio).toBe('self_recite');
    expect(devotee?.prefs.mantraScript).toBe('te');
  });

  it('keeps the prefs the onboarding flow chose', () => {
    useDevoteeStore.getState().createDevotee({
      ...draft,
      prefs: { uiLang: 'te', mantraScript: 'dev' },
    });

    const prefs = useDevoteeStore.getState().devotee?.prefs;
    expect(prefs?.uiLang).toBe('te');
    expect(prefs?.mantraScript).toBe('dev');
    expect(prefs?.showTransliteration).toBe(true);
  });
});

describe('family CRUD', () => {
  beforeEach(() => {
    useDevoteeStore.getState().createDevotee(draft);
  });

  it('adds a member and hands back their id', () => {
    const id = useDevoteeStore.getState().addFamilyMember({
      name: { te: '', en: 'Spouse' },
      relation: 'spouse',
      gender: 'female',
      includeInSankalpam: true,
    });

    const family = useDevoteeStore.getState().devotee?.family ?? [];
    expect(family).toHaveLength(1);
    expect(family[0]?.id).toBe(id);
  });

  it('edits one member without touching the others', () => {
    const first = useDevoteeStore.getState().addFamilyMember({
      name: { te: '', en: 'Spouse' },
      relation: 'spouse',
      gender: 'female',
      includeInSankalpam: true,
    });
    useDevoteeStore.getState().addFamilyMember({
      name: { te: '', en: 'Son' },
      relation: 'son',
      gender: 'male',
      includeInSankalpam: true,
    });

    useDevoteeStore.getState().updateFamilyMember(first, { includeInSankalpam: false });

    const family = useDevoteeStore.getState().devotee?.family ?? [];
    expect(family[0]?.includeInSankalpam).toBe(false);
    expect(family[1]?.includeInSankalpam).toBe(true);
  });

  it('removes a member', () => {
    const id = useDevoteeStore.getState().addFamilyMember({
      name: { te: '', en: 'Son' },
      relation: 'son',
      gender: 'male',
      includeInSankalpam: true,
    });

    useDevoteeStore.getState().removeFamilyMember(id);
    expect(useDevoteeStore.getState().devotee?.family).toEqual([]);
  });

  it('bumps updatedAt on every change', () => {
    const before = useDevoteeStore.getState().devotee?.updatedAt ?? '';
    jest.useFakeTimers().setSystemTime(new Date(Date.now() + 5000));

    useDevoteeStore.getState().addFamilyMember({
      name: { te: '', en: 'Daughter' },
      relation: 'daughter',
      gender: 'female',
      includeInSankalpam: false,
    });

    expect(useDevoteeStore.getState().devotee?.updatedAt).not.toBe(before);
    jest.useRealTimers();
  });

  it('does nothing when there is no devotee yet', () => {
    useDevoteeStore.getState().reset();
    useDevoteeStore.getState().updateFamilyMember('member_x', { includeInSankalpam: false });
    useDevoteeStore.getState().removeFamilyMember('member_x');
    expect(useDevoteeStore.getState().devotee).toBeNull();
  });
});

describe('onboarding completion', () => {
  it('is not complete until both a devotee and a finish time exist', () => {
    expect(hasOnboarded(useDevoteeStore.getState())).toBe(false);

    useDevoteeStore.getState().createDevotee(draft);
    expect(hasOnboarded(useDevoteeStore.getState())).toBe(false);

    useDevoteeStore.getState().completeOnboarding();
    expect(hasOnboarded(useDevoteeStore.getState())).toBe(true);
  });

  it('will not mark onboarding complete without a devotee', () => {
    useDevoteeStore.getState().completeOnboarding();
    expect(useDevoteeStore.getState().onboardedAt).toBeNull();
  });
});

describe('persistence across a relaunch', () => {
  it('writes the devotee to storage and reads it back', async () => {
    useDevoteeStore.getState().createDevotee(draft);
    useDevoteeStore.getState().completeOnboarding();
    const saved = useDevoteeStore.getState().devotee;

    // What a relaunch actually restores is the bytes on disk, so keep them:
    // emptying the in-memory store here would persist the empty state over
    // them, which a killed process never does.
    const onDisk = storage.getString(DEVOTEE_STORAGE_KEY);
    expect(onDisk).toBeDefined();

    useDevoteeStore.setState({ devotee: null, onboardedAt: null, hydrated: false });
    storage.set(DEVOTEE_STORAGE_KEY, onDisk as string);
    await useDevoteeStore.persist.rehydrate();

    expect(useDevoteeStore.getState().devotee).toEqual(saved);
    expect(hasOnboarded(useDevoteeStore.getState())).toBe(true);
    expect(useDevoteeStore.getState().hydrated).toBe(true);
  });

  it('drops a stored record that no longer matches §9.4 rather than half-loading it', async () => {
    storage.set(
      DEVOTEE_STORAGE_KEY,
      JSON.stringify({
        state: { devotee: { id: 'devotee_1', name: { te: '' } }, onboardedAt: '2026-01-01' },
        version: 1,
      }),
    );

    await useDevoteeStore.persist.rehydrate();

    expect(useDevoteeStore.getState().devotee).toBeNull();
    expect(hasOnboarded(useDevoteeStore.getState())).toBe(false);
  });

  it('survives a corrupt blob without crashing the first frame', async () => {
    storage.set(DEVOTEE_STORAGE_KEY, '{ not json');
    await useDevoteeStore.persist.rehydrate();

    expect(useDevoteeStore.getState().devotee).toBeNull();
    expect(useDevoteeStore.getState().hydrated).toBe(true);
  });

  it('forgets everything on reset (§13 delete my data)', async () => {
    useDevoteeStore.getState().createDevotee(draft);
    useDevoteeStore.getState().completeOnboarding();

    useDevoteeStore.getState().reset();
    await useDevoteeStore.persist.rehydrate();

    expect(useDevoteeStore.getState().devotee).toBeNull();
  });
});
