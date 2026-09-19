import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Txt, colors, spacing } from '@epooja/ui';
import poojas from '@/mocks/poojas.json';
import prepare from '@/mocks/prepare.json';

/**
 * Pooja detail (§8.4): description, the short/full duration variants, a steps
 * overview accordion, and Prepare / Start.
 */
const SECTIONS = [
  { id: 'poorvangam', title: 'Poorvangam', steps: ['Achamanam', 'Pranayamam', 'Sankalpam', 'Kalasha Puja'] },
  { id: 'pradhana', title: 'Pradhana Puja', steps: ['Dhyanam', 'Avahanam', 'Shodashopachara', 'Ashtottaram'] },
  { id: 'uttarangam', title: 'Uttarangam', steps: ['Naivedyam', 'Harathi', 'Pradakshina', 'Kshamapana'] },
];

export default function PoojaDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [open, setOpen] = useState<string | null>('poorvangam');
  const [variant, setVariant] = useState<'short' | 'full'>('short');

  const item = poojas.sections.flatMap((s) => s.items).find((p) => p.slug === slug);
  const title = item?.title ?? prepare.subtitle;

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: spacing[8] }}
    >
      <Card tone="cream" padding={5}>
        <Txt variant="screenTitle" tone="ink">
          {title}
        </Txt>
        <View style={{ height: spacing[2] }} />
        <Txt variant="body" tone="inkMuted">
          The daily household puja, from Achamanam through Harathi. Guided mode speaks each
          instruction in Telugu before the mantra; Chant mode plays the mantras alone.
        </Txt>
      </Card>

      <Card tone="cream" padding={5}>
        <Txt variant="sectionTitle" tone="ink">
          Duration
        </Txt>
        <View style={{ height: spacing[3] }} />
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          {(['short', 'full'] as const).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected: variant === key }}
              accessibilityLabel={key === 'short' ? 'Short, about 15 minutes' : 'Full, about 45 minutes'}
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
                  {key === 'short' ? '≈ 15 min' : '≈ 45 min'}
                </Txt>
              </Card>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card tone="cream" padding={5}>
        <Txt variant="sectionTitle" tone="ink">
          Steps
        </Txt>
        <View style={{ height: spacing[2] }} />
        {SECTIONS.map((section, index) => (
          <View
            key={section.id}
            style={{
              borderBottomWidth: index === SECTIONS.length - 1 ? 0 : 1,
              borderBottomColor: colors.cream['300'],
              paddingVertical: spacing[3],
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open === section.id }}
              accessibilityLabel={section.title}
              onPress={() => {
                setOpen((current) => (current === section.id ? null : section.id));
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Txt variant="cardTitle" tone="ink">
                {section.title}
              </Txt>
              <MaterialCommunityIcons
                name={open === section.id ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={colors.ink['400'] as string}
              />
            </Pressable>

            {open === section.id ? (
              <View style={{ paddingTop: spacing[2], gap: spacing[1] }}>
                {section.steps.map((step) => (
                  <Txt key={step} variant="body" tone="inkMuted">
                    · {step}
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
            router.push(`/pooja/${slug}/prepare`);
          }}
        />
        <Button
          label="Start"
          tone="maroon"
          size="lg"
          icon="play"
          style={{ flex: 1 }}
          onPress={() => {
            router.push(`/player/${slug}`);
          }}
        />
      </View>
    </ScrollView>
  );
}
