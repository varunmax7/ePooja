import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, TextField, Txt, colors, spacing } from '@epooja/ui';
import { enumDisplay, isTodoPandit, type EnumFile, type EnumValue } from '@epooja/content';

/**
 * A searchable full-screen picker over one `content/enums/*.json` file —
 * §8.1's "searchable list" for gothram and janma nakshatram, in both scripts.
 *
 * Search matches the Telugu form, the IAST form and the raw query against
 * either, so a devotee can type in whichever script they're comfortable
 * with. A `⟨TODO_PANDIT: …⟩` placeholder never appears in the results or the
 * search index — showing it would read as the app inventing a name.
 */

export interface EnumSearchPickerProps {
  visible: boolean;
  title: string;
  file: EnumFile;
  selectedId: string | null;
  onSelect: (value: EnumValue) => void;
  onClose: () => void;
  /** §8.1: every ritual field on this step can be left unset. */
  allowUnknown?: boolean;
  onUnknown?: () => void;
}

function displayOrNull(value: EnumValue, script: 'te' | 'iast'): string | null {
  const text = enumDisplay(value, script);
  return isTodoPandit(text) ? null : text;
}

function matches(value: EnumValue, needle: string): boolean {
  if (needle.length === 0) return true;
  const te = displayOrNull(value, 'te');
  const iast = displayOrNull(value, 'iast');
  return (
    (te?.includes(needle) ?? false) ||
    (iast?.toLocaleLowerCase().includes(needle.toLocaleLowerCase()) ?? false) ||
    value.id.includes(needle.toLocaleLowerCase())
  );
}

export function EnumSearchPicker({
  visible,
  title,
  file,
  selectedId,
  onSelect,
  onClose,
  allowUnknown = true,
  onUnknown,
}: EnumSearchPickerProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => file.values.filter((value) => matches(value, query.trim())),
    [file, query],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }} className="bg-cream-50">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing[5],
          }}
        >
          <Txt variant="screenTitle" tone="maroon">
            {title}
          </Txt>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={colors.maroon['800'] as string} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: spacing[5] }}>
          <TextField
            label="Search"
            value={query}
            onChangeText={setQuery}
            placeholder="Type in Telugu or English…"
            autoFocus
          />
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing[5], gap: spacing[2] }}
          ListEmptyComponent={
            <Txt variant="body" tone="inkMuted" align="center">
              No match. Try a different spelling.
            </Txt>
          }
          renderItem={({ item }) => {
            const te = displayOrNull(item, 'te');
            const iast = displayOrNull(item, 'iast');
            const selected = item.id === selectedId;
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Card tone={selected ? 'cream' : 'outlined'} padding={4}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Txt variant="cardTitle" tone={te ? 'ink' : 'inkMuted'}>
                      {te ?? item.id}
                    </Txt>
                    {selected ? (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={colors.maroon['700'] as string}
                      />
                    ) : null}
                  </View>
                  {iast ? (
                    <Txt variant="transliteration" tone="inkMuted">
                      {iast}
                    </Txt>
                  ) : null}
                </Card>
              </Pressable>
            );
          }}
        />

        {allowUnknown ? (
          <View style={{ padding: spacing[5] }}>
            <Button
              label="I don't know"
              tone="ghost"
              onPress={() => {
                onUnknown?.();
                onClose();
              }}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
