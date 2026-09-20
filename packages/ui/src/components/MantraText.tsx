import { View } from 'react-native';
import { spacing } from '../tokens';
import { mantraVariantFor, type MantraScript } from '../typography';
import { Txt } from './Txt';

export interface MantraLineView {
  id: string;
  /** The line in the script the devotee chose. No ritual text lives in code (§15). */
  text: string;
  transliteration?: string;
  meaning?: string;
}

export interface MantraTextProps {
  lines: MantraLineView[];
  /** Index of the line currently being chanted. */
  activeIndex: number;
  script: MantraScript;
  showTransliteration?: boolean;
  showMeaning?: boolean;
}

/**
 * §7.4 `MantraText`: the current line in maroon and bold, neighbours dimmed,
 * transliteration underneath and an optional meaning.
 *
 * Lines arrive as data. The component never contains Sanskrit or Telugu — a
 * lint rule enforces that (§15).
 */
export function MantraText({
  lines,
  activeIndex,
  script,
  showTransliteration = true,
  showMeaning = false,
}: MantraTextProps) {
  const mantraVariant = mantraVariantFor(script);

  return (
    <View style={{ gap: spacing[3], alignSelf: 'stretch' }}>
      {lines.map((line, index) => {
        const active = index === activeIndex;
        return (
          <View key={line.id} style={{ opacity: active ? 1 : 0.45, gap: spacing[1] }}>
            <Txt variant={mantraVariant} tone={active ? 'maroon' : 'inkMuted'} align="center">
              {line.text}
            </Txt>

            {showTransliteration && line.transliteration ? (
              <Txt variant="transliteration" tone="inkMuted" align="center">
                {line.transliteration}
              </Txt>
            ) : null}

            {showMeaning && line.meaning ? (
              <Txt variant="label" tone="inkMuted" align="center">
                {line.meaning}
              </Txt>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
