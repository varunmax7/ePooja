import { toNewDevotee, useOnboardingDraft } from '@/stores/onboardingDraft';

const LOCATION = {
  lat: 17.385,
  lng: 78.4867,
  tz: 'Asia/Kolkata',
  cityId: 'hyderabad',
  label: 'Hyderabad, Telangana',
};

beforeEach(() => {
  useOnboardingDraft.getState().reset();
});

describe('the onboarding draft store', () => {
  it('starts with no ritual field set, so a devotee who skips everything is valid', () => {
    const state = useOnboardingDraft.getState();
    expect(state.gotraId).toBeNull();
    expect(state.nakshatraId).toBeNull();
    expect(state.rasiId).toBeNull();
    expect(state.family).toEqual([]);
  });

  it('collects family members with a stable local id', () => {
    useOnboardingDraft.getState().addFamilyDraft({
      name: { te: '', en: 'Spouse' },
      relation: 'spouse',
      gender: 'female',
      includeInSankalpam: true,
    });

    const family = useOnboardingDraft.getState().family;
    expect(family).toHaveLength(1);
    expect(family[0]?.draftId).toBeTruthy();
  });

  it('removes a family member by draft id', () => {
    useOnboardingDraft.getState().addFamilyDraft({
      name: { te: '', en: 'Son' },
      relation: 'son',
      gender: 'male',
      includeInSankalpam: true,
    });
    const id = useOnboardingDraft.getState().family[0]?.draftId as string;

    useOnboardingDraft.getState().removeFamilyDraft(id);
    expect(useOnboardingDraft.getState().family).toEqual([]);
  });

  it('resets every field, not just some of them', () => {
    const store = useOnboardingDraft.getState();
    store.setName({ te: '', en: 'Someone' });
    store.setGotra('vasishtha', null);
    store.setNakshatra('rohini', 3);
    store.addFamilyDraft({
      name: { te: '', en: 'Son' },
      relation: 'son',
      gender: 'male',
      includeInSankalpam: true,
    });

    store.reset();

    const after = useOnboardingDraft.getState();
    expect(after.name).toEqual({ te: '', en: '' });
    expect(after.gotraId).toBeNull();
    expect(after.nakshatraId).toBeNull();
    expect(after.family).toEqual([]);
  });
});

describe('toNewDevotee', () => {
  const base = {
    name: { te: '', en: 'Varun' },
    gender: 'male' as const,
    gotraId: null,
    gotraCustom: null,
    nakshatraId: null,
    nakshatraPada: null,
    rasiId: null,
    uiLang: 'en' as const,
    mantraScript: 'te' as const,
  };

  it('defaults an unset gender to male rather than leaving it undefined', () => {
    const devotee = toNewDevotee({ ...base, gender: null as never }, LOCATION);
    expect(devotee.gender).toBe('male');
  });

  it('omits every ritual field the devotee said "I don\'t know" to', () => {
    const devotee = toNewDevotee(base, LOCATION);
    expect(devotee.gotraId).toBeUndefined();
    expect(devotee.gotraCustom).toBeUndefined();
    expect(devotee.nakshatraId).toBeUndefined();
    expect(devotee.nakshatraPada).toBeUndefined();
    expect(devotee.rasiId).toBeUndefined();
  });

  it('carries a listed gotra', () => {
    const devotee = toNewDevotee({ ...base, gotraId: 'vasishtha' }, LOCATION);
    expect(devotee.gotraId).toBe('vasishtha');
    expect(devotee.gotraCustom).toBeUndefined();
  });

  it('carries a custom gotra when nothing was picked from the list', () => {
    const devotee = toNewDevotee({ ...base, gotraCustom: 'Kashyapa' }, LOCATION);
    expect(devotee.gotraCustom).toBe('Kashyapa');
    expect(devotee.gotraId).toBeUndefined();
  });

  it('never sends both a listed and a custom gotra, even if the draft somehow has both', () => {
    // Defence in depth: the screens keep these mutually exclusive, but the
    // §9.4 schema's refine would reject a devotee carrying both.
    const devotee = toNewDevotee({ ...base, gotraId: 'vasishtha', gotraCustom: 'Kashyapa' }, LOCATION);
    expect(devotee.gotraId).toBe('vasishtha');
    expect(devotee.gotraCustom).toBeUndefined();
  });

  it('carries the location and the chosen prefs through untouched', () => {
    const devotee = toNewDevotee(base, LOCATION);
    expect(devotee.location).toBe(LOCATION);
    expect(devotee.prefs).toEqual({ uiLang: 'en', mantraScript: 'te' });
  });
});
