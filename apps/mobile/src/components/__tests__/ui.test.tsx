import { Dimensions, StyleSheet, type TextStyle } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import {
  Button,
  CheckRow,
  FieldCard,
  FontScaleProvider,
  MantraText,
  ModeToggle,
  ProgressPill,
  StepProgress,
  TimingRow,
  TransportControls,
  Txt,
  clampFontScale,
  fontFamily,
  textStyles,
} from '@epooja/ui';

/**
 * Behaviour and accessibility of the §7.4 primitives, under jest-expo — the
 * only place in the repo that can render React Native.
 *
 * `render` and `fireEvent` are async in RNTL 14 (React 19 concurrent roots),
 * so every test awaits them.
 */
describe('Button', () => {
  it('fires onPress and exposes an accessible name', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<Button label="Start Pooja" onPress={onPress} />);

    await fireEvent.press(getByRole('button', { name: 'Start Pooja' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<Button label="Start Pooja" onPress={onPress} disabled />);

    await fireEvent.press(getByRole('button', { name: 'Start Pooja' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('CheckRow', () => {
  it('reports its checked state to screen readers', async () => {
    const { getByRole } = await render(<CheckRow label="Akshatalu" checked onToggle={jest.fn()} />);

    expect(getByRole('checkbox', { name: 'Akshatalu' }).props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it('toggles on press', async () => {
    const onToggle = jest.fn();
    const { getByRole } = await render(
      <CheckRow label="Kalasham" checked={false} onToggle={onToggle} />,
    );

    await fireEvent.press(getByRole('checkbox', { name: 'Kalasham' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('FieldCard', () => {
  it('shows the label uppercased above the value', async () => {
    const { getByText } = await render(
      <FieldCard label="Birth Star" value="Rohini" secondary="pada 3" />,
    );

    expect(getByText('BIRTH STAR')).toBeTruthy();
    expect(getByText('Rohini')).toBeTruthy();
    expect(getByText('pada 3')).toBeTruthy();
  });
});

describe('ProgressPill', () => {
  it('renders the caller-formatted label', async () => {
    const { getByText } = await render(<ProgressPill label="4/6 ready" done={4} total={6} />);
    expect(getByText('4/6 ready')).toBeTruthy();
  });

  it('survives a zero total without dividing by zero', async () => {
    const { getByText } = await render(<ProgressPill label="0/0 ready" done={0} total={0} />);
    expect(getByText('0/0 ready')).toBeTruthy();
  });
});

describe('StepProgress', () => {
  it('exposes the position as a progressbar', async () => {
    const { getByRole } = await render(
      <StepProgress caption="Step 4 of 14: Kalasha Puja" progress={0.42} />,
    );

    expect(getByRole('progressbar').props.accessibilityValue).toMatchObject({
      now: 42,
      min: 0,
      max: 100,
    });
  });

  it('clamps a progress value outside 0–1', async () => {
    const { getByRole } = await render(<StepProgress caption="Step 1" progress={1.8} />);
    expect(getByRole('progressbar').props.accessibilityValue).toMatchObject({ now: 100 });
  });
});

describe('ModeToggle', () => {
  it('marks the active mode as selected', async () => {
    const { getByRole } = await render(
      <ModeToggle mode="chant" chantLabel="Chant Mode" guidedLabel="Guided" onChange={jest.fn()} />,
    );

    expect(getByRole('tab', { name: 'Chant Mode' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('switches to guided narration when tapped', async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <ModeToggle mode="chant" chantLabel="Chant Mode" guidedLabel="Guided" onChange={onChange} />,
    );

    await fireEvent.press(getByRole('tab', { name: 'Guided' }));
    expect(onChange).toHaveBeenCalledWith('guided');
  });
});

describe('TransportControls', () => {
  const labels = { play: 'Play', pause: 'Pause', previous: 'Previous step', next: 'Next step' };

  it('names the coin by what pressing it will do', async () => {
    const { getByRole, rerender } = await render(
      <TransportControls playing={false} onPlayPause={jest.fn()} labels={labels} />,
    );
    expect(getByRole('button', { name: 'Play' })).toBeTruthy();

    await rerender(<TransportControls playing onPlayPause={jest.fn()} labels={labels} />);
    expect(getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  it('disables a step button with no handler', async () => {
    const { getByRole } = await render(
      <TransportControls playing={false} onPlayPause={jest.fn()} labels={labels} />,
    );

    expect(getByRole('button', { name: 'Previous step' }).props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});

describe('TimingRow', () => {
  it('offers a reminder switch only when the caller wants one', async () => {
    const { queryByRole } = await render(<TimingRow label="Morning" range="06:04 – 08:30" />);
    expect(queryByRole('switch')).toBeNull();
  });

  it('shows the bell when a reminder handler is given', async () => {
    const { getByRole } = await render(
      <TimingRow label="Morning" range="06:04 – 08:30" reminderOn onToggleReminder={jest.fn()} />,
    );

    expect(getByRole('switch', { name: 'Reminder for Morning' })).toBeTruthy();
  });
});

describe('MantraText', () => {
  // Ritual text never appears in code (§15), so the test uses the same
  // ⟨TODO_PANDIT: …⟩ placeholders the Phase 1 mocks carry.
  const lines = [
    { id: 'l1', text: '⟨TODO_PANDIT: line_1⟩', transliteration: 'line one' },
    { id: 'l2', text: '⟨TODO_PANDIT: line_2⟩', transliteration: 'line two' },
  ];

  it('renders every line with its transliteration', async () => {
    const { getByText } = await render(<MantraText lines={lines} activeIndex={0} script="te" />);

    expect(getByText('⟨TODO_PANDIT: line_1⟩')).toBeTruthy();
    expect(getByText('line two')).toBeTruthy();
  });

  it('hides transliteration when the devotee turns it off', async () => {
    const { queryByText } = await render(
      <MantraText lines={lines} activeIndex={0} script="te" showTransliteration={false} />,
    );

    expect(queryByText('line one')).toBeNull();
  });
});

describe('Dynamic Type (§10 Phase 1: up to 130%)', () => {
  const styleOf = (node: { props: { style?: unknown } }): TextStyle =>
    StyleSheet.flatten(node.props.style as TextStyle);

  it('lays text out at the token metrics when nothing is scaling', async () => {
    const { getByText } = await render(
      <FontScaleProvider scale={1}>
        <Txt variant="screenTitle">Today</Txt>
      </FontScaleProvider>,
    );
    const style = styleOf(getByText('Today'));

    expect(style.fontSize).toBe(textStyles.screenTitle.fontSize);
    expect(style.lineHeight).toBe(textStyles.screenTitle.lineHeight);
  });

  it('follows the OS text size when no override is set', async () => {
    // The device is the default source; the override exists for the screenshot
    // harness on web, where there is no OS setting to read.
    const osScale = clampFontScale(Dimensions.get('window').fontScale);
    const { getByText } = await render(<Txt variant="screenTitle">Today</Txt>);

    expect(styleOf(getByText('Today')).fontSize).toBeCloseTo(
      textStyles.screenTitle.fontSize * osScale,
      1,
    );
  });

  it('moves fontSize and lineHeight together at 130%', async () => {
    const { getByText } = await render(
      <FontScaleProvider scale={1.3}>
        <Txt variant="screenTitle">Today</Txt>
      </FontScaleProvider>,
    );
    const style = styleOf(getByText('Today'));

    expect(style.fontSize).toBeCloseTo(textStyles.screenTitle.fontSize * 1.3, 1);
    expect(style.lineHeight).toBeCloseTo(textStyles.screenTitle.lineHeight * 1.3, 1);
  });

  it("turns RN's own scaling off, so the OS cannot scale the size a second time", async () => {
    const { getByText } = await render(<Txt>Today</Txt>);
    expect(getByText('Today').props.allowFontScaling).toBe(false);
  });

  it('clamps past the ceiling the layouts are proven at', async () => {
    const { getByText } = await render(
      <FontScaleProvider scale={3}>
        <Txt variant="body">Today</Txt>
      </FontScaleProvider>,
    );

    expect(styleOf(getByText('Today')).fontSize).toBeCloseTo(textStyles.body.fontSize * 1.3, 1);
  });

  it('scales mantra lines too, keeping the svara headroom §7.3 requires', async () => {
    const lines = [{ id: 'l1', text: '⟨TODO_PANDIT: line_1⟩' }];
    const { getByText } = await render(
      <FontScaleProvider scale={1.3}>
        <MantraText lines={lines} activeIndex={0} script="te" />
      </FontScaleProvider>,
    );
    const style = styleOf(getByText('⟨TODO_PANDIT: line_1⟩'));

    expect(style.fontSize).toBeCloseTo(textStyles.mantraTelugu.fontSize * 1.3, 1);
    expect(style.lineHeight! / style.fontSize!).toBeGreaterThanOrEqual(1.55);
  });

  it('keeps the per-script mantra face', async () => {
    const lines = [{ id: 'l1', text: '⟨TODO_PANDIT: line_1⟩' }];
    const { getByText } = await render(<MantraText lines={lines} activeIndex={0} script="dev" />);

    expect(styleOf(getByText('⟨TODO_PANDIT: line_1⟩')).fontFamily).toBe(
      fontFamily.mantraDevanagari,
    );
  });
});
