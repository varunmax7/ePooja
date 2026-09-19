import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChantDisc,
  MantraText,
  ModeToggle,
  StepProgress,
  TransportControls,
  Txt,
  colors,
  elevation,
  gradients,
  radius,
  shadow,
  spacing,
  type PlayerMode,
} from '@epooja/ui';
import player from '@/mocks/player.json';

/**
 * Chant Player (§8.6, mockup screen 4).
 *
 * Phase 1 is the static shell: the disc animates and the mode toggles, but
 * nothing plays — Phase 6 drives this from the XState puja runner and RNTP.
 *
 * The action prompt overlay is the Guided-mode behaviour §8.6 describes: after
 * the instruction clip, a large card tells the devotee what to do with their
 * hands, and waits.
 */
export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<PlayerMode>(player.mode as PlayerMode);
  const [promptVisible, setPromptVisible] = useState(true);

  const showPrompt = mode === 'guided' && promptVisible;

  return (
    <LinearGradient
      colors={[...gradients.saffronHeader] as [string, string, string]}
      style={{ flex: 1, paddingTop: insets.top }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing[5],
          paddingVertical: spacing[3],
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close player"
          hitSlop={10}
          onPress={() => {
            router.back();
          }}
        >
          <MaterialCommunityIcons
            name="chevron-down"
            size={28}
            color={colors.maroon['800'] as string}
          />
        </Pressable>

        <Txt variant="cardTitle" tone="maroon">
          {player.title} – {player.subtitle}
        </Txt>

        <Pressable accessibilityRole="button" accessibilityLabel="Player options" hitSlop={10}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={colors.maroon['800'] as string}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[7],
          gap: spacing[5],
        }}
      >
        <ChantDisc playing={playing} />

        <StepProgress
          caption={`Step ${player.step.index} of ${player.step.total}: ${player.step.title}`}
          progress={player.step.progress}
          elapsed={player.step.elapsed}
          remaining={player.step.remaining}
        />

        <MantraText lines={player.lines} activeIndex={1} script="te" showTransliteration />

        <TransportControls
          playing={playing}
          onPlayPause={() => {
            setPlaying((p) => !p);
          }}
          onPrevious={() => undefined}
          onNext={() => undefined}
          labels={player.transport}
        />

        <ModeToggle
          mode={mode}
          chantLabel={player.modeLabels.chant}
          guidedLabel={player.modeLabels.guided}
          onChange={setMode}
        />
      </ScrollView>

      {showPrompt ? (
        <View
          style={{
            position: 'absolute',
            left: spacing[5],
            right: spacing[5],
            bottom: Math.max(insets.bottom, spacing[5]),
          }}
        >
          <View
            style={[
              {
                backgroundColor: colors.maroon['800'],
                borderRadius: radius.xl,
                padding: spacing[5],
                gap: spacing[3],
              },
              elevation(shadow.raised),
            ]}
          >
            <Txt variant="mantraTeluguSmall" tone="cream" align="center">
              {player.actionPrompt.te}
            </Txt>
            <Txt variant="label" tone="cream" align="center">
              {player.actionPrompt.en}
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={player.actionPrompt.doneLabel}
              onPress={() => {
                setPromptVisible(false);
              }}
              style={{
                alignSelf: 'center',
                backgroundColor: colors.gold['500'],
                borderRadius: radius.pill,
                paddingVertical: spacing[3],
                paddingHorizontal: spacing[7],
              }}
            >
              <Txt variant="cardTitle" tone="maroon">
                {player.actionPrompt.doneLabel} ✓
              </Txt>
            </Pressable>
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
}
