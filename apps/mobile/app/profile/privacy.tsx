import { ScrollView, View } from 'react-native';
import { Txt, spacing } from '@epooja/ui';

/**
 * Privacy Policy (§10 Phase 8, §13: "privacy policy URL, in-app account
 * deletion" — both stores require a reachable policy). The text below is a
 * first draft written to the DPDP Act 2023's shape (purpose, consent,
 * retention, deletion) and needs the client's/legal sign-off before release,
 * the same way ritual content needs the pandit's — this file is the
 * non-ritual equivalent of a `PENDING_PANDIT_REVIEW` placeholder.
 */
export default function PrivacyScreen() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-cream-50"
      contentContainerStyle={{ padding: spacing[5], paddingBottom: spacing[8] }}
    >
      <View style={{ gap: spacing[4] }}>
        <Txt variant="label" tone="danger">
          Draft — not yet reviewed by legal counsel. Do not submit to an app store until this is
          replaced with an approved policy and the placeholders below are filled in.
        </Txt>

        <Txt variant="screenTitle" tone="ink">
          Privacy Policy
        </Txt>
        <Txt variant="label" tone="inkMuted">
          Last updated: [date] · Effective for: ePooja (com.epooja.app)
        </Txt>

        <Section title="What stays on your device">
          Your name, gothram, nakshatram, family members and location are stored only on your phone
          unless you choose to sign in. Signing in is optional and only enables backing up your
          profile and using it on another device.
        </Section>

        <Section title="What we collect if you sign in">
          Your profile (as above), a record of which poojas you have completed and when, and the
          identity your sign-in provider (Google or Apple) shares with us — typically your name and
          email address. We do not sell this data or share it with advertisers.
        </Section>

        <Section title="Location">
          Your location is used on-device to calculate sunrise, tithi and other Panchangam values.
          If you sign in, your location is stored rounded to roughly 1 km so your Sankalpam can name
          the right place without storing your exact address.
        </Section>

        <Section title="Analytics">
          We record which screens are used and which poojas are started or completed, to improve the
          app. We never send your name, gothram, nakshatram or exact location to our analytics
          provider.
        </Section>

        <Section title="Your consent">
          By signing in, you consent to the collection described above, under the Digital Personal
          Data Protection Act, 2023. You can withdraw consent at any time by signing out and
          deleting your account from Account &amp; Sync.
        </Section>

        <Section title="Deleting your data">
          Deleting your account permanently removes your synced profile, puja history and any voice
          recording of your name from our servers. Your local, on-device profile is yours to keep or
          remove separately, regardless of whether you have an account.
        </Section>

        <Section title="Contact">
          For privacy questions or to exercise your rights under the DPDP Act, contact [support
          email / grievance officer contact — to be filled in before release].
        </Section>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ gap: spacing[1] }}>
      <Txt variant="sectionTitle" tone="ink">
        {title}
      </Txt>
      <Txt variant="body" tone="inkMuted">
        {children}
      </Txt>
    </View>
  );
}
