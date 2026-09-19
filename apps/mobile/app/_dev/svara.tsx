import { Platform, ScrollView, View } from 'react-native';
import { Card, Txt, colors, fontFamily, spacing } from '@epooja/ui';

/**
 * Vedic svara rendering spike (§7.3).
 *
 * The question this answers: do the Vedic accent marks — anudatta (U+0952),
 * udatta (U+0951) and the Vedic Extensions block (U+1CD0–U+1CFF) — actually
 * render when combined with Telugu letters, or do they fall back to tofu?
 *
 * If Telugu cannot carry them, §7.3's fallback applies: svara display becomes
 * Devanagari-only and Telugu mantra text is shown plain.
 *
 * Every sample is built from code points rather than pasted text. That keeps
 * the file free of Indic literals (§15) and makes it unambiguous which
 * character is under test.
 */
const TELUGU_KA = 0x0c15;
const DEVANAGARI_KA = 0x0915;
const UDATTA = 0x0951;
const ANUDATTA = 0x0952;
const VEDIC_TONE_KARSHANA = 0x1cd0;
const VEDIC_TONE_SHARA = 0x1cd1;
const VEDIC_SIGN_NIHSHVASA = 0x1ce1;

interface Sample {
  id: string;
  description: string;
  text: string;
}

function combine(base: number, ...marks: number[]): string {
  return String.fromCodePoint(base, ...marks);
}

const SAMPLES: Sample[] = [
  { id: 'te-plain', description: 'Telugu KA, no mark', text: combine(TELUGU_KA) },
  { id: 'te-udatta', description: 'Telugu KA + udatta U+0951', text: combine(TELUGU_KA, UDATTA) },
  { id: 'te-anudatta', description: 'Telugu KA + anudatta U+0952', text: combine(TELUGU_KA, ANUDATTA) },
  {
    id: 'te-karshana',
    description: 'Telugu KA + Vedic tone karshana U+1CD0',
    text: combine(TELUGU_KA, VEDIC_TONE_KARSHANA),
  },
  {
    id: 'te-shara',
    description: 'Telugu KA + Vedic tone shara U+1CD1',
    text: combine(TELUGU_KA, VEDIC_TONE_SHARA),
  },
  {
    id: 'te-nihshvasa',
    description: 'Telugu KA + Vedic sign nihshvasa U+1CE1',
    text: combine(TELUGU_KA, VEDIC_SIGN_NIHSHVASA),
  },
  { id: 'dev-plain', description: 'Devanagari KA, no mark', text: combine(DEVANAGARI_KA) },
  { id: 'dev-udatta', description: 'Devanagari KA + udatta U+0951', text: combine(DEVANAGARI_KA, UDATTA) },
  {
    id: 'dev-anudatta',
    description: 'Devanagari KA + anudatta U+0952',
    text: combine(DEVANAGARI_KA, ANUDATTA),
  },
  {
    id: 'dev-karshana',
    description: 'Devanagari KA + Vedic tone karshana U+1CD0',
    text: combine(DEVANAGARI_KA, VEDIC_TONE_KARSHANA),
  },
];

export default function SvaraSpikeScreen() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4], paddingBottom: spacing[8] }}
    >
      <Card tone="outlined" padding={5}>
        <Txt variant="sectionTitle" tone="maroon">
          Vedic svara rendering — {Platform.OS}
        </Txt>
        <View style={{ height: spacing[2] }} />
        <Txt variant="body" tone="ink">
          Each row shows the same base letter with one accent mark. A mark that renders shows above
          or below the letter; a mark that does not shows as a box, a blank, or a mark floating in
          its own cell.
        </Txt>
        <View style={{ height: spacing[2] }} />
        <Txt variant="label" tone="inkMuted">
          If the Telugu rows fail on either platform, §7.3&apos;s fallback applies: svara marks are
          shown in Devanagari only, and Telugu mantra text renders plain. Record the outcome in
          docs/adr/0003-typography.md.
        </Txt>
      </Card>

      {SAMPLES.map((sample) => {
        const telugu = sample.id.startsWith('te-');
        return (
          <Card key={sample.id} tone="cream" padding={4}>
            <Txt variant="fieldLabel" tone="inkMuted">
              {sample.description.toUpperCase()}
            </Txt>
            <View style={{ height: spacing[2] }} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[6] }}>
              <Sample
                caption={telugu ? 'Tiro Telugu' : 'Tiro Devanagari'}
                family={telugu ? fontFamily.mantraTelugu : fontFamily.mantraDevanagari}
                text={sample.text}
              />
              <Sample
                caption={telugu ? 'Noto Sans Telugu' : 'Mukta'}
                family={telugu ? fontFamily.uiTelugu : fontFamily.uiBody}
                text={sample.text}
              />
              <Sample caption="System" family={undefined} text={sample.text} />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Sample({
  caption,
  family,
  text,
}: {
  caption: string;
  family: string | undefined;
  text: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: spacing[1] }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.cream['300'],
          borderRadius: spacing[2],
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          minWidth: 64,
          alignItems: 'center',
        }}
      >
        <Txt
          variant="mantraTelugu"
          tone="ink"
          style={family ? { fontFamily: family as never } : { fontFamily: undefined }}
        >
          {text}
        </Txt>
      </View>
      <Txt variant="fieldLabel" tone="inkMuted">
        {caption}
      </Txt>
    </View>
  );
}
