import { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useMachine } from '@xstate/react';
import {
  Button,
  Card,
  CheckRow,
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
  type MantraLineView,
  type MantraScript,
} from '@epooja/ui';
import type { PujaCatalogItem, PujaStep, PujaVariant } from '@epooja/content';
import { pujaBySlug, runnableSteps, samagriForPuja } from '@/services/content';
import { contentTextFor, pujaTitle } from '@/lib/pujaDisplay';
import { pujaRunnerMachine, type PujaRunnerMode } from '@/machines/pujaRunner.machine';
import { BUNDLED_AUDIO_MANIFEST, buildStepQueue, useQueuePlayback } from '@/services/audio';
import {
  buildDevoteeSankalpam,
  buildDevoteeSankalpamAudioPlan,
  useSankalpamRunner,
} from '@/services/sankalpam';
import { useDevoteeStore } from '@/stores/devotee';
import { usePanchangam, useTodayDate } from '@/services/panchangam';
import { useChecklistStore } from '@/stores/checklist';
import { useSessionStore } from '@/stores/session';

const KEEP_AWAKE_TAG = 'puja-runner';

/**
 * Chant Player (§8.6, mockup screen 4) — wired to the Puja Runner machine
 * (§9.7), real puja content (§10 Phase 6's `runnableSteps` composition) and
 * `services/audio`'s queue (§9.6).
 *
 * §9.6 recording has not started, so every clip this loads is unresolved and
 * `useQueuePlayback` treats a step's audio as finished the moment it would
 * have started (see that hook's own note) — the runner still walks every
 * step, in order, in both modes; only the sound is missing until Phase 7.
 */
export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug, variant: variantParam } = useLocalSearchParams<{
    slug: string;
    variant?: string;
  }>();
  const variant: PujaVariant = variantParam === 'full' ? 'full' : 'short';

  const puja = pujaBySlug(slug);
  const steps = useMemo(() => (puja ? runnableSteps(puja, variant) : []), [puja, variant]);

  const devotee = useDevoteeStore((s) => s.devotee);
  const script: MantraScript = devotee?.prefs.mantraScript ?? 'te';
  const { date } = useTodayDate();
  const { data: panchangam } = usePanchangam(date, devotee?.location);

  const resumePoint = useSessionStore((s) => (puja ? s.resumePointFor(puja.id) : undefined));
  const saveResumePoint = useSessionStore((s) => s.saveResumePoint);
  const clearResumePoint = useSessionStore((s) => s.clearResumePoint);
  const logCompletedSession = useSessionStore((s) => s.logCompletedSession);

  const needsSankalpam = steps.some((step) => step.dynamic === 'sankalpam');
  const sankalpamText = useMemo(
    () =>
      devotee && panchangam && puja && needsSankalpam
        ? buildDevoteeSankalpam(devotee, panchangam, puja.deity)
        : undefined,
    [devotee, panchangam, puja, needsSankalpam],
  );
  const sankalpamPlan = useMemo(
    () =>
      devotee && panchangam && puja && needsSankalpam
        ? buildDevoteeSankalpamAudioPlan(devotee, panchangam, puja.deity, BUNDLED_AUDIO_MANIFEST)
        : undefined,
    [devotee, panchangam, puja, needsSankalpam],
  );
  const readyToStart = steps.length > 0 && (!needsSankalpam || sankalpamPlan !== undefined);

  // A resume point only applies if it still fits this session's own step list
  // (the devotee could have switched duration variant since exiting).
  const resumeAtStepIndex =
    resumePoint && resumePoint.variant === variant && resumePoint.stepIndex < steps.length
      ? resumePoint.stepIndex
      : undefined;

  const [snapshot, send] = useMachine(pujaRunnerMachine, {
    input: {
      pujaId: puja?.id ?? slug ?? '',
      variant,
      mode: resumePoint?.mode ?? 'guided',
      steps,
      autoAdvance: false,
      resumeAtStepIndex,
    },
  });

  useEffect(() => {
    if (snapshot.matches('idle')) send({ type: 'START' });
  }, [snapshot, send]);

  useEffect(() => {
    if (snapshot.matches('preparing') && readyToStart) send({ type: 'READY' });
  }, [snapshot, readyToStart, send]);

  useEffect(() => {
    const awake = snapshot.matches('preparing') || snapshot.matches('step') || snapshot.matches('paused');
    if (awake) void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => {
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [snapshot]);

  useEffect(() => {
    if (!puja) return;
    if (snapshot.matches('exited')) {
      saveResumePoint({
        pujaId: puja.id,
        variant,
        mode: snapshot.context.mode,
        stepIndex: snapshot.context.stepIndex,
        startedAt: snapshot.context.startedAt ?? new Date().toISOString(),
        exitedAt: new Date().toISOString(),
      });
      router.back();
    }
  }, [snapshot, puja, variant, router, saveResumePoint]);

  useEffect(() => {
    if (!puja) return;
    if (snapshot.matches('completed')) {
      clearResumePoint(puja.id);
      logCompletedSession({
        pujaId: puja.id,
        variant,
        mode: snapshot.context.mode,
        startedAt: snapshot.context.startedAt ?? new Date().toISOString(),
        completedAt: new Date().toISOString(),
        completedSteps: steps.length,
      });
    }
  }, [snapshot, puja, variant, steps.length, clearResumePoint, logCompletedSession]);

  const currentStep: PujaStep | undefined = steps[snapshot.context.stepIndex];
  const stepSubstate = snapshot.matches('step')
    ? (snapshot.value as { step: string }).step
    : undefined;
  // Instruction and chant are loaded as *separate* queues, one phase at a
  // time (see `queue.ts`'s own note on why) — never both together, and
  // nothing at all while awaiting a confirm or sitting on `done`.
  const phase = stepSubstate === 'instruction' ? 'instruction' : stepSubstate === 'chanting' ? 'chant' : null;

  // A `dynamic: 'sankalpam'` step's chant phase steps through its own audio
  // plan (§10 Phase 7) — self-recited segments need a real pause, which the
  // generic one-queue-per-phase path below has no way to express. `isSankalpamChant`
  // routes the chant phase to `useSankalpamRunner` instead, and the generic
  // path's own queue/callback go inert for exactly that long so the two
  // never both try to drive `AUDIO_ENDED` at once.
  const isSankalpamChant = phase === 'chant' && currentStep?.dynamic === 'sankalpam';

  const queue = useMemo(
    () =>
      currentStep && phase && !isSankalpamChant
        ? buildStepQueue(currentStep, snapshot.context.mode, phase)
        : [],
    [currentStep, phase, isSankalpamChant, snapshot.context.mode],
  );

  const onAudioEnded = useCallback(() => {
    if (!isSankalpamChant) send({ type: 'AUDIO_ENDED' });
  }, [isSankalpamChant, send]);

  const genericAudio = useQueuePlayback(queue, onAudioEnded);

  const onSankalpamComplete = useCallback(() => {
    send({ type: 'AUDIO_ENDED' });
  }, [send]);

  const sankalpamRunner = useSankalpamRunner(
    sankalpamPlan ?? [],
    BUNDLED_AUDIO_MANIFEST,
    isSankalpamChant,
    onSankalpamComplete,
  );

  const audio = genericAudio;

  const [showSettings, setShowSettings] = useState(false);
  const [showSamagri, setShowSamagri] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);

  if (!puja) {
    return (
      <View style={{ flex: 1, padding: spacing[5] }} className="bg-cream-50">
        <Card tone="outlined" padding={5}>
          <Txt variant="body" tone="inkMuted">
            That pooja isn&apos;t in this app yet.
          </Txt>
        </Card>
      </View>
    );
  }

  if (snapshot.matches('completed')) {
    return (
      <CompletedScreen
        title={pujaTitle(puja)}
        onDone={() => {
          router.back();
        }}
      />
    );
  }

  const inAwaitingAction = stepSubstate === 'awaitingAction';
  const paused = snapshot.matches('paused');

  const lines: MantraLineView[] = currentStep
    ? currentStep.dynamic === 'sankalpam' && sankalpamText
      ? [{ id: 'sankalpam', text: contentTextFor({ te: sankalpamText.te, dev: sankalpamText.dev, iast: sankalpamText.iast }, script) }]
      : (currentStep.namavali?.names ?? currentStep.chant?.lines ?? []).map((line) => ({
          id: line.id,
          text: contentTextFor(line.text, script),
          meaning: line.meaning ? contentTextFor(line.meaning, script) : undefined,
        }))
    : [];

  const progress = audio.duration > 0 ? audio.position / audio.duration : 0;
  const namavali = currentStep?.namavali;

  // §9.6.1's self-recite prompt text — whichever segment `useSankalpamRunner`
  // is currently pausing on, read back from the same `buildSankalpamText`
  // output the backdrop below already renders in full.
  const selfReciteSegment =
    sankalpamRunner.awaitingSelfRecite && sankalpamText
      ? sankalpamText.segments.find((segment) => segment.id === sankalpamRunner.activeItem?.segmentId)
      : undefined;
  const selfReciteText =
    selfReciteSegment?.resolution.status === 'resolved'
      ? contentTextFor(selfReciteSegment.resolution.text, script)
      : undefined;
  const selfReciteLabel =
    sankalpamRunner.activeItem?.kind === 'self_recite' && sankalpamRunner.activeItem.slot === 'GOTRA'
      ? 'Say your gotra aloud'
      : 'Say your name aloud';

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
            send({ type: 'EXIT' });
          }}
        >
          <MaterialCommunityIcons
            name="chevron-down"
            size={28}
            color={colors.maroon['800'] as string}
          />
        </Pressable>

        <Txt variant="cardTitle" tone="maroon">
          {pujaTitle(puja)}
        </Txt>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Player options"
          hitSlop={10}
          onPress={() => {
            setShowSettings(true);
          }}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={colors.maroon['800'] as string}
          />
        </Pressable>
      </View>

      {!readyToStart ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Txt tone="maroon">Preparing today&rsquo;s Sankalpam…</Txt>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              alignItems: 'center',
              paddingHorizontal: spacing[5],
              paddingBottom: spacing[7],
              gap: spacing[5],
            }}
          >
            <ChantDisc playing={audio.playing} />

            <StepProgress
              caption={`Step ${snapshot.context.stepIndex + 1} of ${steps.length}: ${currentStep ? contentTextFor(currentStep.title, script) : ''}`}
              progress={progress}
            />

            <MantraText lines={lines} activeIndex={0} script={script} showMeaning={showMeaning} />

            {namavali ? (
              <NamavaliTap
                count={snapshot.context.namavaliCount}
                total={namavali.count}
                onTap={() => {
                  void Haptics.selectionAsync();
                  send({ type: 'NAMAVALI_TAP' });
                }}
              />
            ) : null}

            <TransportControls
              playing={audio.playing}
              onPlayPause={() => {
                if (paused) {
                  send({ type: 'RESUME' });
                  return;
                }
                if (audio.playing) {
                  audio.pause();
                } else {
                  audio.play();
                }
              }}
              onPrevious={() => {
                send({ type: 'PREV' });
              }}
              onNext={() => {
                send({ type: 'NEXT' });
              }}
              labels={{ play: 'Play', pause: 'Pause', previous: 'Previous step', next: 'Next step' }}
            />

            <ModeToggle
              mode={snapshot.context.mode}
              chantLabel="Chant Mode"
              guidedLabel="Guided Narration Mode"
              onChange={(mode: PujaRunnerMode) => {
                send({ type: 'SET_MODE', mode });
              }}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setShowSamagri(true);
              }}
            >
              <Txt variant="label" tone="maroon">
                Samagri checklist
              </Txt>
            </Pressable>
          </ScrollView>

          {inAwaitingAction && currentStep?.instruction ? (
            <ActionPrompt
              text={contentTextFor(currentStep.instruction.text, script)}
              onDone={() => {
                send({ type: 'CONFIRM' });
              }}
            />
          ) : null}

          {sankalpamRunner.awaitingSelfRecite ? (
            <SelfRecitePrompt
              label={selfReciteLabel}
              text={selfReciteText}
              onContinue={sankalpamRunner.continueSelfRecite}
            />
          ) : null}
        </>
      )}

      {showSettings ? (
        <SettingsSheet
          autoAdvance={snapshot.context.autoAdvance}
          showMeaning={showMeaning}
          onAutoAdvanceChange={(autoAdvance) => {
            send({ type: 'SET_AUTO_ADVANCE', autoAdvance });
          }}
          onShowMeaningChange={setShowMeaning}
          onRateChange={(rate) => {
            audio.setRate(rate);
          }}
          onClose={() => {
            setShowSettings(false);
          }}
        />
      ) : null}

      {showSamagri ? (
        <SamagriSheet
          puja={puja}
          date={date}
          onClose={() => {
            setShowSamagri(false);
          }}
        />
      ) : null}
    </LinearGradient>
  );
}

function CompletedScreen({ title, onDone }: { title: string; onDone: () => void }) {
  return (
    <LinearGradient
      colors={[...gradients.saffronHeader] as [string, string, string]}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[5], padding: spacing[6] }}
    >
      <MaterialCommunityIcons name="flower" size={56} color={colors.maroon['800'] as string} />
      <Txt variant="screenTitle" tone="maroon" align="center">
        Pooja Sampoornam
      </Txt>
      <Txt variant="body" tone="ink" align="center">
        {title} is complete.
      </Txt>
      <Button label="Done" tone="maroon" size="lg" onPress={onDone} />
    </LinearGradient>
  );
}

function NamavaliTap({
  count,
  total,
  onTap,
}: {
  count: number;
  total: number;
  onTap: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Offer, ${count} of ${total}`}
      onPress={onTap}
      style={{ alignItems: 'center', gap: spacing[2] }}
    >
      <MaterialCommunityIcons name="flower-tulip" size={48} color={colors.saffron['600'] as string} />
      <Txt variant="label" tone="maroon">
        {count} / {total}
      </Txt>
    </Pressable>
  );
}

function ActionPrompt({ text, onDone }: { text: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  return (
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
          {text}
        </Txt>
        <Button label="Done" tone="gold" onPress={onDone} />
      </View>
    </View>
  );
}

/**
 * §9.6.1's self-recite prompt: no clip exists for the devotee's own name (or
 * a gotra the pandit has not recorded) — the devotee says it aloud instead.
 * Large text, a tap to move on sooner, or `SELF_RECITE_NOMINAL_MS` passing
 * on its own (`useSankalpamRunner`'s own timer, not this component's).
 */
function SelfRecitePrompt({
  label,
  text,
  onContinue,
}: {
  label: string;
  text: string | undefined;
  onContinue: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: spacing[5],
        right: spacing[5],
        bottom: Math.max(insets.bottom, spacing[5]),
      }}
    >
      <Pressable onPress={onContinue} accessibilityRole="button" accessibilityLabel="Continue">
        <View
          style={[
            {
              backgroundColor: colors.maroon['800'],
              borderRadius: radius.xl,
              padding: spacing[6],
              gap: spacing[3],
              alignItems: 'center',
            },
            elevation(shadow.raised),
          ]}
        >
          <Txt variant="label" tone="gold">
            {label}
          </Txt>
          <Txt variant="screenTitle" tone="cream" align="center">
            {text ?? ''}
          </Txt>
        </View>
      </Pressable>
    </View>
  );
}

function SettingsSheet({
  autoAdvance,
  showMeaning,
  onAutoAdvanceChange,
  onShowMeaningChange,
  onRateChange,
  onClose,
}: {
  autoAdvance: boolean;
  showMeaning: boolean;
  onAutoAdvanceChange: (value: boolean) => void;
  onShowMeaningChange: (value: boolean) => void;
  onRateChange: (rate: number) => void;
  onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose} title="Player settings">
      <CheckRow
        label="Auto-advance to next step"
        checked={autoAdvance}
        onToggle={() => {
          onAutoAdvanceChange(!autoAdvance);
        }}
      />
      <CheckRow
        label="Show meaning"
        checked={showMeaning}
        onToggle={() => {
          onShowMeaningChange(!showMeaning);
        }}
      />
      <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] }}>
        {[0.75, 1, 1.25].map((rate) => (
          <Pressable
            key={rate}
            accessibilityRole="button"
            onPress={() => {
              onRateChange(rate);
            }}
            style={{ flex: 1 }}
          >
            <Card tone="cream" padding={3}>
              <Txt variant="label" tone="ink" align="center">
                {rate}x
              </Txt>
            </Card>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

function SamagriSheet({
  puja,
  date,
  onClose,
}: {
  puja: PujaCatalogItem;
  date: string;
  onClose: () => void;
}) {
  const items = useMemo(() => samagriForPuja(puja), [puja]);
  const entries = useChecklistStore((s) => s.entries);
  const toggle = useChecklistStore((s) => s.toggle);
  const checkedIds = entries[`${puja.id}:${date}`] ?? [];

  return (
    <Sheet onClose={onClose} title="Samagri checklist">
      {items.map((item) => (
        <CheckRow
          key={item.id}
          label={item.name.en ?? item.name.te}
          checked={checkedIds.includes(item.id)}
          onToggle={() => {
            void Haptics.selectionAsync();
            toggle(puja.id, date, item.id);
          }}
          icon={item.icon as never}
        />
      ))}
    </Sheet>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        justifyContent: 'flex-end',
      }}
    >
      <Pressable
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: 0,
          backgroundColor: colors.ink['900'],
          opacity: 0.3,
        }}
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <View
        style={{
          backgroundColor: colors.cream['50'],
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing[5],
          gap: spacing[2],
        }}
      >
        <Txt variant="sectionTitle" tone="ink">
          {title}
        </Txt>
        {children}
      </View>
    </View>
  );
}
