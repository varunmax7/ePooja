import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  AngaBadge,
  AvatarRing,
  Button,
  Card,
  ChantDisc,
  CheckRow,
  DateDial,
  FamilyChip,
  FieldCard,
  MantraText,
  ModeToggle,
  ProgressPill,
  RecipePreviewCard,
  StepProgress,
  SunTimesCard,
  TimingRow,
  TransportControls,
  Txt,
  colors,
  gradients,
  radius,
  spacing,
  textStyles,
  type PlayerMode,
  type TextStyleName,
} from '@epooja/ui';
import player from '@/mocks/player.json';
import today from '@/mocks/today.json';

/**
 * Storybook-lite (§10 Phase 1): every §7.4 component on one scrollable page,
 * with mock data. Dev-only — it is not linked from any product screen except
 * the dial on Today, which Phase 3 repoints at the panchangam sheet.
 */
export default function ComponentGallery() {
  const [checked, setChecked] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<PlayerMode>('chant');

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ padding: spacing[5], gap: spacing[6], paddingBottom: spacing[9] }}
    >
      <Section title="Palette (§7.2)">
        <View style={{ gap: spacing[2] }}>
          {(['maroon', 'saffron', 'gold', 'cream', 'ink'] as const).map((family) => (
            <View
              key={family}
              style={{ flexDirection: 'row', gap: spacing[1], alignItems: 'center' }}
            >
              <Txt variant="fieldLabel" tone="inkMuted" style={{ width: 64 }}>
                {family}
              </Txt>
              {Object.entries(colors[family]).map(([step, value]) => (
                <View
                  key={step}
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: radius.sm,
                    backgroundColor: value,
                    borderWidth: 1,
                    borderColor: colors.cream['300'],
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </Section>

      <Section title="Gradients">
        <View style={{ gap: spacing[2] }}>
          {Object.entries(gradients).map(([name, stops]) => (
            <View
              key={name}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
            >
              <Txt variant="fieldLabel" tone="inkMuted" style={{ width: 100 }}>
                {name}
              </Txt>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  height: 28,
                  borderRadius: radius.sm,
                  overflow: 'hidden',
                }}
              >
                {stops.map((stop) => (
                  <View key={stop} style={{ flex: 1, backgroundColor: stop }} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Type scale (§7.3)">
        <View style={{ gap: spacing[2] }}>
          {(Object.keys(textStyles) as TextStyleName[]).map((name) => (
            <View
              key={name}
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[3] }}
            >
              <Txt variant="fieldLabel" tone="inkMuted" style={{ width: 130 }}>
                {name}
              </Txt>
              <Txt variant={name} tone="ink" numberOfLines={1} style={{ flex: 1 }}>
                Aa Bb · {textStyles[name].fontSize}
              </Txt>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Buttons">
        <View style={{ gap: spacing[3] }}>
          <Button label="Start Pooja" tone="maroon" size="lg" icon="play" />
          <Button label="View Recipe" tone="gold" />
          <Button label="Prepare" tone="ghost" icon="clipboard-check-outline" />
          <Button label="Disabled" disabled />
        </View>
      </Section>

      <Section title="FieldCard · AvatarRing · FamilyChip">
        <View style={{ gap: spacing[3] }}>
          <FieldCard
            label="Birth Star"
            value={today.angas.nakshatra.value}
            valueScript="telugu"
            secondary="Mula · pada 2"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[5] }}>
            <AvatarRing initials="RV" onEdit={() => undefined} />
            <FamilyChip name="Spouse" />
            <FamilyChip name="Add" add />
          </View>
        </View>
      </Section>

      <Section title="DateDial + AngaBadge (§8.2)">
        <View style={{ alignItems: 'center', gap: spacing[4] }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' }}
          >
            <AngaBadge
              kind="tithi"
              label={today.angas.tithi.label}
              value={today.angas.tithi.value}
            />
            <AngaBadge
              kind="nakshatra"
              label={today.angas.nakshatra.label}
              value={today.angas.nakshatra.value}
              align="right"
            />
          </View>
          <DateDial
            weekday={today.date.weekday}
            day={today.date.day}
            month={today.date.month}
            year={today.date.year}
          />
        </View>
      </Section>

      <Section title="SunTimesCard · TimingRow">
        <View style={{ gap: spacing[3] }}>
          <SunTimesCard {...today.sun} />
          <Card tone="cream" padding={4}>
            <TimingRow
              label="Morning"
              range="06:04 – 08:30"
              reminderOn
              onToggleReminder={() => undefined}
            />
            <TimingRow label="Rahu kalam" range="09:07 – 10:38" caution last />
          </Card>
        </View>
      </Section>

      <Section title="CheckRow · ProgressPill">
        <Card tone="cream" padding={4}>
          <ProgressPill label="4/6 ready" done={4} total={6} />
          <CheckRow
            label="Akshatalu (turmeric rice)"
            checked={checked}
            onToggle={() => {
              setChecked((c) => !c);
            }}
            icon="rice"
          />
          <CheckRow
            label="Kalasham with water"
            checked={false}
            onToggle={() => undefined}
            icon="cup-water"
          />
        </Card>
      </Section>

      <Section title="RecipePreviewCard">
        <RecipePreviewCard
          eyebrow="Offerings Recipe Preview:"
          title="Pulihora"
          buttonLabel="View Recipe"
        />
      </Section>

      <Section title="ChantDisc · TransportControls · StepProgress · ModeToggle (§8.6)">
        <View style={{ alignItems: 'center', gap: spacing[4] }}>
          <ChantDisc playing={playing} size={180} />
          <StepProgress
            caption="Step 4 of 14: Kalasha Puja"
            progress={0.42}
            elapsed="1:12"
            remaining="-1:38"
          />
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
            chantLabel="Chant Mode"
            guidedLabel="Guided Narration"
            onChange={setMode}
          />
        </View>
      </Section>

      <Section title="MantraText">
        <Card tone="cream" padding={4}>
          <MantraText lines={player.lines} activeIndex={1} script="te" showTransliteration />
        </Card>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing[3] }}>
      <Txt variant="sectionTitle" tone="maroon">
        {title}
      </Txt>
      {children}
    </View>
  );
}
