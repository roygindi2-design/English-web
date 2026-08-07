import RegisteredAddress from '@/components/RegisteredAddress';

/**
 * Layout harness for check:mobile. NOT a product screen and NOT linked from
 * anywhere.
 *
 * TD-13: the harness runs without Supabase env, so `/onboarding` answers 307 to
 * `/login?expired=1` and every line reporting "ok /onboarding …" is really
 * measuring the login screen. The band would therefore ship unmeasured — the
 * exact F-007 pattern. `fixture@example.com` is nobody: RFC 2606 reserves
 * example.com precisely so that test addresses cannot reach a real person.
 */
export default function DevIdentityPage() {
  return (
    <>
      <p className="text-sm text-ink-muted">בדיקת פריסה — אינו מסך מוצר</p>
      <RegisteredAddress email="fixture@example.com" />
    </>
  );
}
