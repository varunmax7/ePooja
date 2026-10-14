import { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
import {
  BUNDLED_AUDIO_MANIFEST,
  buildStepQueue,
  DEV_PLACEHOLDER_AUDIO_ENABLED,
  speechTextFor,
  useDevSpeechPlayback,
  useQueuePlayback,
} from '@/services/audio';
import {
  buildDevoteeSankalpam,
  buildDevoteeSankalpamAudioPlan,
  useSankalpamRunner,
} from '@/services/sankalpam';
import { useDevoteeStore } from '@/stores/devotee';
import { usePanchangam, useTodayDate } from '@/services/panchangam';
import { useChecklistStore } from '@/stores/checklist';
import { useSessionStore } from '@/stores/session';
import { useAuthStore } from '@/stores/auth';
import { pushCompletedSession } from '@/services/sync';

const KEEP_AWAKE_TAG = 'puja-runner';

function noop(): void {}

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
  const { t } = useTranslation('player');
  const { t: tCommon } = useTranslation('common');
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
    const awake =
      snapshot.matches('preparing') || snapshot.matches('step') || snapshot.matches('paused');
    // Only attempt activation when this render is actually in an awake state —
    // an unconditional cleanup would try to deactivate a tag that was never
    // activated at all (e.g. unmounting from `idle`/`exited`).
    if (!awake) return undefined;

    // `activateKeepAwakeAsync` is genuinely async (on web it awaits
    // `navigator.wakeLock.request`), and `snapshot` can change again — re-
    // running this effect — before that promise settles. `activated`/
    // `cancelled` track which of "activation finished first" or "cleanup ran
    // first" actually happened, so a deactivate is only ever attempted once
    // a matching activate is known to have succeeded:
    // - cleanup first: skip deactivating (nothing is actually held yet), but
    //   still release it the moment activation does land, rather than
    //   leaking the lock.
    // - activation first: cleanup deactivates normally.
    // Either way, `deactivateKeepAwake` is never called for a tag that was
    // never activated — on web that throws "the wake lock with tag … has
    // not activated yet" (`expo-keep-awake`'s own web shim only tracks a tag
    // once `activate` resolves); the `.catch` below is a last-resort net for
    // any other platform/timing quirk, not the primary fix.
    let activated = false;
    let cancelled = false;

    void activateKeepAwakeAsync(KEEP_AWAKE_TAG)
      .then(() => {
        if (cancelled) void deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
        else activated = true;
      })
      .catch((error: unknown) => {
        // `console.warn`, not `console.error` — an already-handled, expected
        // degraded mode (same reasoning as `useQueuePlayback.ts`'s identical
        // note): Metro/Expo's web LogBox promotes any `console.error` call to
        // the same full-screen blocking overlay a true uncaught exception
        // gets, defeating the point of catching this at all.
        console.warn('activateKeepAwakeAsync failed; keep-awake is unavailable', error);
      });

    return () => {
      cancelled = true;
      if (activated) void deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
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

  const authUserId = useAuthStore((s) => (s.status === 'signed_in' ? s.userId : null));

  useEffect(() => {
    if (!puja) return;
    if (snapshot.matches('completed')) {
      clearResumePoint(puja.id);
      const entry = {
        pujaId: puja.id,
        variant,
        mode: snapshot.context.mode,
        startedAt: snapshot.context.startedAt ?? new Date().toISOString(),
        completedAt: new Date().toISOString(),
        completedSteps: steps.length,
      };
      logCompletedSession(entry);
      // Best-effort (§17 offline-first): the local log above is already the
      // durable record regardless of whether this reaches the server.
      if (authUserId) void pushCompletedSession(authUserId, entry);
    }
  }, [snapshot, puja, variant, steps.length, clearResumePoint, logCompletedSession, authUserId]);

  const currentStep: PujaStep | undefined = steps[snapshot.context.stepIndex];
  const stepSubstate = snapshot.matches('step')
    ? (snapshot.value as { step: string }).step
    : undefined;
  // Instruction and chant are loaded as *separate* queues, one phase at a
  // time (see `queue.ts`'s own note on why) — never both together, and
  // nothing at all while awaiting a confirm or sitting on `done`.
  const phase =
    stepSubstate === 'instruction' ? 'instruction' : stepSubstate === 'chanting' ? 'chant' : null;

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

  // The same phase's text, in reading order — what `useDevSpeechPlayback`
  // below actually speaks. Always `te` (`speechTextFor`), never the
  // devotee's display-script preference (`script`, used for `lines` further
  // down) — see that helper's own note on why. This has to exist earlier
  // than `lines`, since a hook needs it before any early `return` in this
  // component.
  const speechTexts = useMemo((): string[] => {
    if (!currentStep || !phase || isSankalpamChant) return [];
    if (phase === 'instruction') {
      return currentStep.instruction ? [speechTextFor(currentStep.instruction.text)] : [];
    }
    const source = currentStep.namavali?.names ?? currentStep.chant?.lines ?? [];
    return source.map((line) => speechTextFor(line.text));
  }, [currentStep, phase, isSankalpamChant]);

  // Dev-only: before §9.6 recording exists, either a non-speech chime
  // (`useQueuePlayback`'s own manifest stays empty, see its note) or —
  // naturally enough to actually sound like a puja — the device's own TTS
  // voice speaking the step's real text (`useDevSpeechPlayback`). Exactly
  // one of the two ever drives `AUDIO_ENDED`: whichever is NOT selected gets
  // a no-op `onEnded`, so its own "nothing resolved" auto-advance (both
  // hooks have one) never fires behind the active hook's back. Never shipped
  // (`DEV_PLACEHOLDER_AUDIO_ENABLED` is `false` in any production build
  // regardless of `__DEV__`), never in a test run either, and never pandit
  // content either way — `isProductionSafe` has nothing to approve here.
  const genericAudio = useQueuePlayback(queue, DEV_PLACEHOLDER_AUDIO_ENABLED ? noop : onAudioEnded);
  const devSpeech = useDevSpeechPlayback(
    speechTexts,
    DEV_PLACEHOLDER_AUDIO_ENABLED ? onAudioEnded : noop,
  );

  const onSankalpamComplete = useCallback(() => {
    send({ type: 'AUDIO_ENDED' });
  }, [send]);

  const sankalpamRunner = useSankalpamRunner(
    sankalpamPlan ?? [],
    BUNDLED_AUDIO_MANIFEST,
    isSankalpamChant,
    onSankalpamComplete,
    sankalpamText,
  );

  const audio = DEV_PLACEHOLDER_AUDIO_ENABLED ? devSpeech : genericAudio;

  const [showSettings, setShowSettings] = useState(false);
  const [showSamagri, setShowSamagri] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);

  if (!puja) {
    return (
      <View style={{ flex: 1, padding: spacing[5] }} className="bg-cream-50">
        <Card tone="outlined" padding={5}>
          <Txt variant="body" tone="inkMuted">
            {t('unknownPuja')}
          </Txt>
        </Card>
      </View>
    );
  }

  if (snapshot.matches('completed')) {
    return (
      <CompletedScreen
        heading={t('completed.title')}
        body={t('completed.body', { title: pujaTitle(puja) })}
        doneLabel={tCommon('done')}
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
      ? [
          {
            id: 'sankalpam',
            text: contentTextFor(
              { te: sankalpamText.te, dev: sankalpamText.dev, iast: sankalpamText.iast },
              script,
            ),
          },
        ]
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
      ? sankalpamText.segments.find(
          (segment) => segment.id === sankalpamRunner.activeItem?.segmentId,
        )
      : undefined;
  const selfReciteText =
    selfReciteSegment?.resolution.status === 'resolved'
      ? contentTextFor(selfReciteSegment.resolution.text, script)
      : undefined;
  const selfReciteLabel =
    sankalpamRunner.activeItem?.kind === 'self_recite' &&
    sankalpamRunner.activeItem.slot === 'GOTRA'
      ? t('sayGotraAloud')
      : t('sayNameAloud');

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
          accessibilityLabel={t('closePlayerA11y')}
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
          accessibilityLabel={t('optionsA11y')}
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
          <Txt tone="maroon">{t('preparingSankalpam')}</Txt>
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
              caption={t('stepCaption', {
                current: snapshot.context.stepIndex + 1,
                total: steps.length,
                title: currentStep ? contentTextFor(currentStep.title, script) : '',
              })}
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
              labels={{
                play: t('play'),
                pause: t('pause'),
                previous: t('previousStep'),
                next: t('nextStep'),
              }}
            />

            <ModeToggle
              mode={snapshot.context.mode}
              chantLabel={t('chantMode')}
              guidedLabel={t('guidedMode')}
              onChange={(mode: PujaRunnerMode) => {
                send({ type: 'SET_MODE', mode });
              }}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('samagriChecklist')}
              onPress={() => {
                setShowSamagri(true);
              }}
            >
              <Txt variant="label" tone="maroon">
                {t('samagriChecklist')}
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

function CompletedScreen({
  heading,
  body,
  doneLabel,
  onDone,
}: {
  heading: string;
  body: string;
  doneLabel: string;
  onDone: () => void;
}) {
  return (
    <LinearGradient
      colors={[...gradients.saffronHeader] as [string, string, string]}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[5],
        padding: spacing[6],
      }}
    >
      <MaterialCommunityIcons name="flower" size={56} color={colors.maroon['800'] as string} />
      <Txt variant="screenTitle" tone="maroon" align="center">
        {heading}
      </Txt>
      <Txt variant="body" tone="ink" align="center">
        {body}
      </Txt>
      <Button label={doneLabel} tone="maroon" size="lg" onPress={onDone} />
    </LinearGradient>
  );
}

function NamavaliTap({ count, total, onTap }: { count: number; total: number; onTap: () => void }) {
  const { t } = useTranslation('player');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('offerA11y', { count, total })}
      onPress={onTap}
      style={{ alignItems: 'center', gap: spacing[2] }}
    >
      <MaterialCommunityIcons
        name="flower-tulip"
        size={48}
        color={colors.saffron['600'] as string}
      />
      <Txt variant="label" tone="maroon">
        {count} / {total}
      </Txt>
    </Pressable>
  );
}

function ActionPrompt({ text, onDone }: { text: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');
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
        // Announces itself the moment it appears — a devotee mid-ritual is
        // often not looking at the screen, so a screen reader needs to speak
        // the instruction without a manual focus move.
        accessibilityLiveRegion="polite"
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
        <Button label={t('done')} tone="gold" onPress={onDone} />
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
  const { t } = useTranslation('common');
  return (
    <View
      style={{
        position: 'absolute',
        left: spacing[5],
        right: spacing[5],
        bottom: Math.max(insets.bottom, spacing[5]),
      }}
      accessibilityLiveRegion="polite"
    >
      <Pressable onPress={onContinue} accessibilityRole="button" accessibilityLabel={t('continue')}>
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
  const { t } = useTranslation('player');
  return (
    <Sheet onClose={onClose} title={t('settings.title')}>
      <CheckRow
        label={t('settings.autoAdvance')}
        checked={autoAdvance}
        onToggle={() => {
          void Haptics.selectionAsync();
          onAutoAdvanceChange(!autoAdvance);
        }}
      />
      <CheckRow
        label={t('settings.showMeaning')}
        checked={showMeaning}
        onToggle={() => {
          void Haptics.selectionAsync();
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
  const { t } = useTranslation('player');

  return (
    <Sheet onClose={onClose} title={t('samagriChecklist')}>
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
  const { t } = useTranslation('common');
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
        accessibilityRole="button"
        accessibilityLabel={t('close')}
      />
      <View
        accessibilityViewIsModal
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
