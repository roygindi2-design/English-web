/**
 * Profile constants — pure. No React, no DOM, no network, no env.
 *
 * D-016: the product ships with exactly one track. It is still a column and not
 * a hardcoded assumption, because the second track is a data row later and a
 * schema migration if we skip this now (T-015, same reasoning).
 */
export const DEFAULT_TRACK_ID = 'amiram';

export type TrackId = typeof DEFAULT_TRACK_ID;

export type Profile = {
  id: string;
  track_id: TrackId;
};
