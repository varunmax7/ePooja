import { View } from 'react-native';
import { spacing } from '../tokens.js';
import { Card } from './Card.js';
import { Txt } from './Txt.js';

export interface FieldCardProps {
  label: string;
  value: string;
  /** Telugu values are rendered in the Telugu UI face rather than Mukta. */
  valueScript?: 'latin' | 'telugu';
  /** Shown under the value, e.g. the IAST spelling of a gothram. */
  secondary?: string;
}

/**
 * §7.4 `FieldCard`: cream-200 fill, gold-300 hairline, radius 12, a small
 * label above the value. The profile screen is a stack of these.
 */
export function FieldCard({ label, value, valueScript = 'latin', secondary }: FieldCardProps) {
  return (
    <Card tone="outlined" padding={4}>
      <Txt variant="fieldLabel" tone="inkMuted">
        {label.toUpperCase()}
      </Txt>
      <View style={{ height: spacing[1] }} />
      <Txt variant={valueScript === 'telugu' ? 'telugu' : 'fieldValue'} tone="ink">
        {value}
      </Txt>
      {secondary ? (
        <Txt variant="transliteration" tone="inkMuted">
          {secondary}
        </Txt>
      ) : null}
    </Card>
  );
}
