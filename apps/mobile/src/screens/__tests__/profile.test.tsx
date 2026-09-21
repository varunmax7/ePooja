import { fireEvent, render } from '@testing-library/react-native';
import { useDevoteeStore } from '@/stores/devotee';
import type { NewDevotee } from '@/stores/devotee';
import ProfileScreen from '../../../app/(tabs)/profile';
import FamilyListScreen from '../../../app/profile/family/index';

import type { ReactNode } from 'react';

// The screens navigate with `useRouter`; these tests are about what renders
// for a given devotee, not about navigation, so the router is a no-op stub.
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

// `CurvedHeader` draws its band with the imperative `Skia.Path.Make()` API,
// which needs a loaded CanvasKit — the declarative `<Canvas>` mock every
// other Skia component here relies on doesn't cover it. These tests are
// about the profile content the header wraps, not the header's own
// rendering, so it is stubbed to a plain passthrough.
jest.mock('@epooja/ui', () => ({
  ...jest.requireActual('@epooja/ui'),
  CurvedHeader: ({ children, action }: { children?: ReactNode; action?: ReactNode }) => (
    <>
      {action}
      {children}
    </>
  ),
}));

const DEVOTEE: NewDevotee = {
  name: { te: '', en: 'Ramavath Varun' },
  gender: 'male',
  nakshatraId: 'rohini',
  nakshatraPada: 3,
  rasiId: 'vrishabha',
  location: { lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata', label: 'Hyderabad, Telangana' },
};

beforeEach(() => {
  useDevoteeStore.setState({ devotee: null, onboardedAt: null, hydrated: true });
});

describe('ProfileScreen', () => {
  it('renders nothing before a devotee exists, rather than crashing', async () => {
    const { toJSON } = await render(<ProfileScreen />);
    expect(toJSON()).toBeNull();
  });

  it("shows the devotee's name, ritual fields and location", async () => {
    useDevoteeStore.getState().createDevotee(DEVOTEE);
    const { getAllByText, getByText } = await render(<ProfileScreen />);

    expect(getAllByText('Ramavath Varun').length).toBeGreaterThan(0);
    // Rohini's Telugu form and the pada, per content/enums/nakshatra.json.
    expect(getByText('రోహిణి')).toBeTruthy();
    expect(getByText('pada 3')).toBeTruthy();
    expect(getByText('Hyderabad, Telangana')).toBeTruthy();
  });

  it('shows a fallback for a ritual field left unset (§8.1 "I don\'t know")', async () => {
    useDevoteeStore
      .getState()
      .createDevotee({ ...DEVOTEE, nakshatraId: undefined, rasiId: undefined });
    const { getAllByText } = await render(<ProfileScreen />);

    expect(getAllByText('Not set').length).toBeGreaterThan(0);
  });

  it('lists every family member as a chip', async () => {
    useDevoteeStore.getState().createDevotee(DEVOTEE);
    useDevoteeStore.getState().addFamilyMember({
      name: { te: '', en: 'Spouse Name' },
      relation: 'spouse',
      gender: 'female',
      includeInSankalpam: true,
    });

    const { getByText } = await render(<ProfileScreen />);
    expect(getByText('Spouse Name')).toBeTruthy();
  });
});

describe('FamilyListScreen', () => {
  beforeEach(() => {
    useDevoteeStore.getState().createDevotee(DEVOTEE);
  });

  it('adds a member through the form and shows them in the list', async () => {
    const { getByText, getByPlaceholderText } = await render(<FamilyListScreen />);

    await fireEvent.press(getByText('Add family member'));
    await fireEvent.changeText(getByPlaceholderText('Name'), 'Son Name');
    await fireEvent.press(getByText('Add'));

    expect(useDevoteeStore.getState().devotee?.family).toHaveLength(1);
    expect(getByText('Son Name')).toBeTruthy();
  });

  it('removes a member from the store when its trash icon is pressed', async () => {
    useDevoteeStore.getState().addFamilyMember({
      name: { te: '', en: 'Daughter Name' },
      relation: 'daughter',
      gender: 'female',
      includeInSankalpam: false,
    });

    const { getByLabelText } = await render(<FamilyListScreen />);
    await fireEvent.press(getByLabelText('Remove Daughter Name'));

    expect(useDevoteeStore.getState().devotee?.family).toHaveLength(0);
  });
});
