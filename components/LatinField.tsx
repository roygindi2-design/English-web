'use client';

/**
 * The single Latin text input of this product (TD-5).
 *
 * An email address and a password are Latin runs inside an RTL page, and three
 * things have to be right together or the field is subtly wrong: `dir="ltr"` so
 * the caret and the @ sit where the learner expects, the mobile keyboard hints
 * (`inputMode`, `autoCapitalize`, `spellCheck`), and `enterKeyHint` so the
 * action key says "הבא"/"עבור" instead of a bare Enter (F-015). Scattering them
 * across call sites is how one goes missing — `enterKeyHint` is required by the
 * type below precisely so the compiler catches the next field that forgets it.
 *
 * `<EnWord>` deliberately does NOT cover this: it is a <span> that wraps text,
 * and unicode-bidi: isolate on a control the learner types into is not wanted.
 */
export interface LatinFieldProps {
  readonly name: 'email' | 'password' | 'target_score';
  readonly label: string;
  readonly type: 'email' | 'text' | 'password';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly autoComplete: string;
  readonly enterKeyHint: 'next' | 'go';
  readonly inputMode?: 'email' | 'numeric';
  readonly invalid: boolean;
  readonly inputClassName?: string;
  readonly adornment?: React.ReactNode;
  readonly footer?: React.ReactNode;
}

const BASE_INPUT =
  'min-h-touch w-full rounded-xl border border-border-strong bg-surface-raised px-4 py-3 text-left text-lg text-ink outline-none focus:border-brand';

export default function LatinField({
  name,
  label,
  type,
  value,
  onChange,
  autoComplete,
  enterKeyHint,
  inputMode,
  invalid,
  inputClassName,
  adornment,
  footer,
}: LatinFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-medium text-ink">{label}</span>
      <div className="relative">
        <input
          type={type}
          name={name}
          dir="ltr"
          inputMode={inputMode}
          enterKeyHint={enterKeyHint}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          className={[BASE_INPUT, inputClassName].filter(Boolean).join(' ')}
        />
        {adornment}
      </div>
      {footer}
    </label>
  );
}
