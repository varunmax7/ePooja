import { render } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/auth';
import AccountScreen from '../../../app/profile/account';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

beforeEach(() => {
  useAuthStore.setState({
    status: 'guest',
    userId: null,
    email: null,
    provider: null,
    lastSyncedAt: null,
  });
});

describe('AccountScreen', () => {
  it('shows the guest message and sign-in options with no backend configured', async () => {
    const { getByText } = await render(<AccountScreen />);
    expect(getByText("You're using ePooja as a guest")).toBeTruthy();
    expect(getByText('Sign in with Google')).toBeTruthy();
    expect(
      getByText('This build has no backend configured — sign-in will work once one is.'),
    ).toBeTruthy();
  });

  it('shows the signed-in state, sync status and delete flow', async () => {
    useAuthStore.setState({
      status: 'signed_in',
      userId: 'u1',
      email: 'devotee@example.com',
      provider: 'google',
      lastSyncedAt: null,
    });

    const { getByText, queryByText } = await render(<AccountScreen />);
    expect(getByText('Signed in')).toBeTruthy();
    expect(getByText('devotee@example.com · Google')).toBeTruthy();
    expect(getByText('Not synced yet')).toBeTruthy();
    expect(queryByText('Sign in with Google')).toBeNull();

    expect(getByText('Delete my account')).toBeTruthy();
  });
});
