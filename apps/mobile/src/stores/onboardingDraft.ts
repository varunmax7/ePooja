import { create } from 'zustand';
import type {
  DevoteeLocation,
  DevoteePrefs,
  FamilyMember,
  Gender,
  LocalizedText,
} from '@epooja/content';
import type { NewDevotee } from './devotee';

/**
 * The §8.1 wizard's working state.
 *
 * Deliberately not persisted: an interrupted onboarding should restart
 * cleanly rather than resurrect a half-filled devotee from a previous
 * attempt days later. `useDevoteeStore` only receives this once the flow
 * reaches its last step.
 */

export interface FamilyDraft extends Omit<FamilyMember, 'id'> {
  /** Local-only key for list rendering/editing before the member has a store id. */
  draftId: string;
}

interface OnboardingDraftState {
  uiLang: DevoteePrefs['uiLang'];
  mantraScript: DevoteePrefs['mantraScript'];

  name: LocalizedText;
  gender: Gender | null;
  gotraId: string | null;
  gotraCustom: string | null;
  nakshatraId: string | null;
  nakshatraPada: 1 | 2 | 3 | 4 | null;
  rasiId: string | null;

  family: FamilyDraft[];
  location: DevoteeLocation | null;

  setLanguage: (uiLang: DevoteePrefs['uiLang'], mantraScript: DevoteePrefs['mantraScript']) => void;
  setName: (name: LocalizedText) => void;
  setGender: (gender: Gender) => void;
  setGotra: (gotraId: string | null, gotraCustom: string | null) => void;
  setNakshatra: (nakshatraId: string | null, pada: 1 | 2 | 3 | 4 | null) => void;
  setRasi: (rasiId: string | null) => void;

  addFamilyDraft: (member: Omit<FamilyDraft, 'draftId'>) => void;
  removeFamilyDraft: (draftId: string) => void;

  setLocation: (location: DevoteeLocation) => void;

  reset: () => void;
}

const initial = {
  uiLang: 'en' as const,
  mantraScript: 'te' as const,
  name: { te: '', en: '' },
  gender: null,
  gotraId: null,
  gotraCustom: null,
  nakshatraId: null,
  nakshatraPada: null,
  rasiId: null,
  family: [],
  location: null,
};

/**
 * Turns the wizard's draft into the payload `useDevoteeStore.createDevotee`
 * expects. A free function rather than inline in the location screen so the
 * §9.4 "gotra is either listed or custom, never both" rule is exercised by a
 * test, not only observed by eye in a component.
 */
export function toNewDevotee(
  draft: Pick<
    OnboardingDraftState,
    | 'name'
    | 'gender'
    | 'gotraId'
    | 'gotraCustom'
    | 'nakshatraId'
    | 'nakshatraPada'
    | 'rasiId'
    | 'uiLang'
    | 'mantraScript'
  >,
  location: DevoteeLocation,
): NewDevotee {
  return {
    name: draft.name,
    gender: draft.gender ?? 'male',
    ...(draft.gotraId ? { gotraId: draft.gotraId } : {}),
    // A custom gotra only applies when nothing was picked from the list.
    ...(!draft.gotraId && draft.gotraCustom ? { gotraCustom: draft.gotraCustom } : {}),
    ...(draft.nakshatraId ? { nakshatraId: draft.nakshatraId } : {}),
    ...(draft.nakshatraPada ? { nakshatraPada: draft.nakshatraPada } : {}),
    ...(draft.rasiId ? { rasiId: draft.rasiId } : {}),
    location,
    prefs: { uiLang: draft.uiLang, mantraScript: draft.mantraScript },
  };
}

export const useOnboardingDraft = create<OnboardingDraftState>()((set) => ({
  ...initial,

  setLanguage: (uiLang, mantraScript) => {
    set({ uiLang, mantraScript });
  },
  setName: (name) => {
    set({ name });
  },
  setGender: (gender) => {
    set({ gender });
  },
  setGotra: (gotraId, gotraCustom) => {
    set({ gotraId, gotraCustom });
  },
  setNakshatra: (nakshatraId, nakshatraPada) => {
    set({ nakshatraId, nakshatraPada });
  },
  setRasi: (rasiId) => {
    set({ rasiId });
  },

  addFamilyDraft: (member) => {
    set((state) => ({
      family: [...state.family, { ...member, draftId: `f_${Date.now()}_${state.family.length}` }],
    }));
  },
  removeFamilyDraft: (draftId) => {
    set((state) => ({ family: state.family.filter((m) => m.draftId !== draftId) }));
  },

  setLocation: (location) => {
    set({ location });
  },

  reset: () => {
    set(initial);
  },
}));
