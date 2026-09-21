import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Txt, colors, spacing } from '@epooja/ui';
import {
  stepsBySection,
  stepsForVariant,
  type PujaVariant,
  type StepSection,
} from '@epooja/content';
import { pujaBySlug } from '@/services/content';
import { pujaTitle } from '@/lib/pujaDisplay';

const SECTION_TITLES: Record<StepSection, string> = {
  poorvangam: 'Poorvangam',
  pradhana: 'Pradhana Puja',
  uttarangam: 'Uttarangam',
};

/**
 * Pooja detail (§8.4): description, the short/full duration variants, a steps
 * overview accordion, and Prepare / Start — all read from the bundled puja
 * rather than the Phase 1 mock, so the accordion lists this puja's real
 * steps and follows the duration variant the devotee picks.
 */
export default function PoojaDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const puja = pujaBySlug(slug);

  const [variant, setVariant] = useState<PujaVariant>('short');
  const [open, setOpen] = useState<StepSection | null>('poorvangam');

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

  const hasShort = puja.durations.short !== undefined;
  const sections = stepsBySection(stepsForVariant(puja, variant));

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: spacing[8] }}
    >
      <Card tone="cream" padding={5}>
        <Txt variant="screenTitle" tone="ink">
          {pujaTitle(puja)}
        </Txt>
        <Txt variant="telugu" tone="maroon">
          {puja.title.te}
        </Txt>
        <View style={{ height: spacing[2] }} />
        <Txt variant="body" tone="inkMuted">
          {puja.description.en ?? puja.description.te}
        </Txt>
      </Card>

      {hasShort ? (
        <Card tone="cream" padding={5}>
          <Txt variant="sectionTitle" tone="ink">
            Duration
          </Txt>
          <View style={{ height: spacing[3] }} />
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            {(['short', 'full'] as const).map((key) => {
              const minutes = key === 'short' ? puja.durations.short : puja.durations.full;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: variant === key }}
                  accessibilityLabel={`${key === 'short' ? 'Short' : 'Full'}, about ${minutes} minutes`}
                  onPress={() => {
                    setVariant(key);
                  }}
                  style={{ flex: 1 }}
                >
                  <Card tone={variant === key ? 'outlined' : 'cream'} padding={4}>
                    <Txt variant="cardTitle" tone={variant === key ? 'maroon' : 'ink'}>
                      {key === 'short' ? 'Short' : 'Full'}
                    </Txt>
                    <Txt variant="label" tone="inkMuted">
                      ≈ {minutes} min · {stepsForVariant(puja, key).length} steps
                    </Txt>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ) : null}

      <Card tone="cream" padding={5}>
        <Txt variant="sectionTitle" tone="ink">
          Steps
        </Txt>
        <View style={{ height: spacing[2] }} />
        {sections.map((section, index) => (
          <View
            key={section.section}
            style={{
              borderBottomWidth: index === sections.length - 1 ? 0 : 1,
              borderBottomColor: colors.cream['300'],
              paddingVertical: spacing[3],
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open === section.section }}
              accessibilityLabel={SECTION_TITLES[section.section]}
              onPress={() => {
                setOpen((current) => (current === section.section ? null : section.section));
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Txt variant="cardTitle" tone="ink">
                {SECTION_TITLES[section.section]}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                <Txt variant="label" tone="inkMuted">
                  {section.steps.length}
                </Txt>
                <MaterialCommunityIcons
                  name={open === section.section ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.ink['400'] as string}
                />
              </View>
            </Pressable>

            {open === section.section ? (
              <View style={{ paddingTop: spacing[2], gap: spacing[1] }}>
                {section.steps.map((step) => (
                  <Txt key={step.id} variant="body" tone="inkMuted">
                    · {step.title.en ?? step.title.te}
                  </Txt>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing[3] }}>
        <Button
          label="Prepare"
          tone="ghost"
          size="lg"
          icon="clipboard-check-outline"
          style={{ flex: 1 }}
          onPress={() => {
            router.push(`/pooja/${puja.slug}/prepare`);
          }}
        />
        <Button
          label="Start"
          tone="maroon"
          size="lg"
          icon="play"
          style={{ flex: 1 }}
          onPress={() => {
            router.push(`/player/${puja.slug}`);
          }}
        />
      </View>
    </ScrollView>
  );
}
