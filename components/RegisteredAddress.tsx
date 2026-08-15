import EnWord from '@/components/EnWord';
import {
  FIX_ADDRESS_CTA_HE,
  LOGOUT_DESTINATION_FIELD,
  REGISTERED_ADDRESS_LABEL_HE,
} from '@/lib/core/auth';

/**
 * T-026 — the address the learner registered with, on the first screen behind
 * the session wall.
 *
 * While email confirmation is off (Q-001 ⓑ) nothing ever proves the address is
 * real: a learner who typed `gmial.com` has a working account today and no way
 * back into it the moment the session ends. This band is the last place that
 * mistake is still visible to the person who made it, so it names the address
 * and offers exactly one action.
 *
 * A plain <form>, like the sign-out control beside it: it must work with
 * JavaScript disabled, and a POST cannot be triggered by a stray <img> the way a
 * GET can. Not a client component — no state, no handlers.
 */
export default function RegisteredAddress({ email }: { readonly email: string }) {
  return (
    <div
      data-registered-email
      className="flex flex-col gap-2 rounded-2xl border border-border-strong bg-surface-raised px-4 py-3"
    >
      <p className="text-base text-ink-muted">
        {REGISTERED_ADDRESS_LABEL_HE}{' '}
        {/* An address is Latin text inside a Hebrew sentence: without isolation
            the trailing period of the sentence jumps to the wrong end of it. */}
        <EnWord className="font-semibold text-ink">{email}</EnWord>
      </p>
      <form action="/logout" method="post">
        <input type="hidden" name={LOGOUT_DESTINATION_FIELD} value="fix_address" />
        <button
          type="submit"
          className="flex min-h-touch items-center text-base font-semibold text-ink underline"
        >
          {FIX_ADDRESS_CTA_HE}
        </button>
      </form>
    </div>
  );
}
