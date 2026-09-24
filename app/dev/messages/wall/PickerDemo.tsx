'use client';

import { useState } from 'react';
import { WallPicturePicker } from '@/components/WallPicture';
import type { WallPictureKey } from '@/lib/core/wallFeed';

/** T-486 — the opener's picture row, live, for the walk at 320/375/414 (the sheet itself is `fixed`). */
export default function PickerDemo() {
  const [k, setK] = useState<WallPictureKey | undefined>('mountains');
  return (
    <section data-dev-picker className="mt-6 rounded-2xl bg-surface-raised p-4">
      <WallPicturePicker value={k} onChange={setK} />
    </section>
  );
}
