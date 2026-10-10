/**
 * Apple's native sign-in wants a nonce: a random value sent (hashed) with the
 * sign-in request, then sent again (raw) to Supabase alongside Apple's
 * identity token, so Supabase can confirm the token was minted for *this*
 * request and not replayed from a captured one.
 *
 * The actual byte→hex encoding lives in `lib/hex.ts` — it's also what
 * `services/content`'s checksum verification needs — this file re-exports it
 * under the name this module's own history used.
 */
export { bytesToHex } from '@/lib/hex';
